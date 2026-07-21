import prisma from '../utils/prisma.js';
import { createNotification } from './notificationController.js';
import { sendMockEmail, getHtmlEmailTemplate } from '../utils/emailService.js';


export const getProposals = async (req, res) => {
  try {
    const isOrganizer = req.user.role === 'ORGANIZER';
    const proposals = await prisma.eventproposal.findMany({
      where: isOrganizer ? { organizerId: req.user.id } : {},
      include: {
        event: {
          include: {
            institution: { select: { name: true } },
            venue: { select: { name: true } },
            budget: true
          }
        },
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: proposals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createProposal = async (req, res) => {
  try {
    const { title, type, description, startDate, endDate, venueId, segments, institutionId, budget: estimatedBudget } = req.body;
    
    // Use provided institutionId (for Admin) or logged in user's institutionId
    const finalInstitutionId = institutionId ? parseInt(institutionId) : req.user.institutionId;

    const event = await prisma.event.create({
      data: {
        title,
        type,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate || startDate),
        institutionId: finalInstitutionId,
        venueId: venueId ? parseInt(venueId) : null,
        status: 'PROPOSED',
        updatedAt: new Date(),
        segment: {
          create: segments ? segments.map(s => ({ name: s, updatedAt: new Date() })) : []
        }
      }
    });

    // Create budget record if estimatedBudget is provided
    if (estimatedBudget) {
      await prisma.budget.create({
        data: {
          eventId: event.id,
          allocated: parseFloat(estimatedBudget),
          spent: 0
        }
      });
    }

    const proposal = await prisma.eventproposal.create({
      data: {
        eventId: event.id,
        organizerId: req.user.id,
        status: 'PENDING'
      }
    });

    res.status(201).json({ success: true, data: proposal });

    // Notify Admin via email that a new proposal was submitted
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' }, select: { name: true, email: true } });
    if (adminUser?.email) {
      const html = getHtmlEmailTemplate('PROPOSAL_SUBMITTED', { proposalTitle: title });
      sendMockEmail(adminUser.email, adminUser.name, `New Proposal Submitted: ${title}`, html, 'PROPOSAL_SUBMITTED').catch(() => {});
    }
  } catch (error) {
    console.error('Create Proposal Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProposalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const proposalId = parseInt(id);

    const prop = await prisma.eventproposal.findUnique({
      where: { id: proposalId },
      include: { event: true }
    });

    if (!prop) {
      return res.status(404).json({ success: false, message: 'Proposal not found' });
    }

    // Admin Flow: update status & comments
    if (req.user.role === 'ADMIN') {
      const { status, comments } = req.body;
      
      const proposal = await prisma.eventproposal.update({
        where: { id: proposalId },
        data: { status, comments },
        include: { event: true }
      });

      if (status === 'APPROVED') {
        await prisma.event.update({
          where: { id: proposal.eventId },
          data: { status: 'APPROVED' }
        });
      } else if (status === 'REJECTED') {
        await prisma.event.update({
          where: { id: proposal.eventId },
          data: { status: 'CANCELLED' }
        });
      }

      const title = `Event Proposal Status Update`;
      const message = `Your proposal for the event "${proposal.event.title}" has been ${status.toLowerCase()}.${comments ? ' Comment: ' + comments : ''}`;
      await createNotification(proposal.organizerId, title, message, 'PROPOSAL', '/dashboard');

      // Email the organizer about the proposal decision
      const organizerUser = await prisma.user.findUnique({ where: { id: proposal.organizerId }, select: { name: true, email: true } });
      if (organizerUser?.email) {
        const templateType = status === 'APPROVED' ? 'PROPOSAL_APPROVED' : 'PROPOSAL_REJECTED';
        const html = getHtmlEmailTemplate(templateType, {
          proposalTitle: proposal.event.title,
          comments: comments || ''
        });
        sendMockEmail(organizerUser.email, organizerUser.name, `Proposal ${status}: ${proposal.event.title}`, html, templateType).catch(() => {});
      }

      return res.json({ success: true, data: proposal });
    }

    // Organizer Flow: edit details of pending proposals
    if (req.user.role === 'ORGANIZER') {
      if (prop.organizerId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to edit this proposal' });
      }

      if (prop.status !== 'PENDING') {
        return res.status(400).json({ success: false, message: 'Approved or rejected proposals cannot be edited' });
      }

      const { title, description, budget, type } = req.body;

      await prisma.event.update({
        where: { id: prop.eventId },
        data: {
          title: title ? title.trim() : undefined,
          description,
          type,
          updatedAt: new Date()
        }
      });

      if (budget !== undefined) {
        // Find existing budget
        const existingBudget = await prisma.budget.findFirst({
          where: { eventId: prop.eventId }
        });
        if (existingBudget) {
          await prisma.budget.update({
            where: { id: existingBudget.id },
            data: { allocated: parseFloat(budget) }
          });
        } else {
          await prisma.budget.create({
            data: {
              eventId: prop.eventId,
              allocated: parseFloat(budget),
              spent: 0
            }
          });
        }
      }

      // Fetch the updated proposal to return
      const updatedProp = await prisma.eventproposal.findUnique({
        where: { id: proposalId },
        include: {
          event: {
            include: {
              institution: { select: { name: true } },
              venue: { select: { name: true } }
            }
          },
          user: { select: { name: true, email: true } }
        }
      });

      return res.json({ success: true, data: updatedProp });
    }

    return res.status(403).json({ success: false, message: 'Access denied' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProposalstatus = async (req, res) => {
  try {
    const { id } = req.params;

    const proposal = await prisma.eventproposal.delete({
      where: { id: parseInt(id) }
    });

    res.json({ success: true, data: proposal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

