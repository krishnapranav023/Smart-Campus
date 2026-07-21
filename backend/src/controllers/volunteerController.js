import prisma from '../utils/prisma.js';
import { sendMockEmail, getHtmlEmailTemplate } from '../utils/emailService.js';
import { createNotification } from './notificationController.js';

// Apply to volunteer (Student)
export const applyToVolunteer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { eventId, responsibility } = req.body;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: parseInt(eventId) }
    });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if already applied
    const existing = await prisma.volunteer.findFirst({
      where: { userId, eventId: parseInt(eventId) }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already applied to volunteer for this event' });
    }

    const application = await prisma.volunteer.create({
      data: {
        userId,
        eventId: parseInt(eventId),
        responsibility,
        status: 'PENDING',
        updatedAt: new Date()
      },
      include: {
        event: { select: { title: true } },
        user: { select: { name: true } }
      }
    });

    // Notify all event coordinators for this event
    try {
      const coordinators = await prisma.eventcoordinator.findMany({
        where: { eventId: parseInt(eventId) },
        select: { userId: true }
      });

      for (const coordinator of coordinators) {
        await createNotification(
          coordinator.userId,
          `New Volunteer Application`,
          `Student "${application.user.name}" applied for "${responsibility}" in event "${application.event.title}".`,
          'SYSTEM',
          '/volunteers'
        );
      }
    } catch (notifErr) {
      console.error('Failed to notify coordinators on volunteer apply:', notifErr);
    }

    res.json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get current student's applications
export const getMyVolunteering = async (req, res) => {
  try {
    const userId = req.user.id;
    const applications = await prisma.volunteer.findMany({
      where: { userId },
      include: {
        event: {
          select: { id: true, title: true, startDate: true, venue: { select: { name: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get volunteers for events coordinated by current organizer (Organizer)
export const getEventVolunteers = async (req, res) => {
  try {
    const userId = req.user.id;
    const volunteers = await prisma.volunteer.findMany({
      where: {
        event: {
          eventcoordinator: {
            some: { userId }
          }
        }
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, institution: { select: { name: true } } }
        },
        event: {
          select: { id: true, title: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: volunteers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update status of volunteer application (Organizer)
export const updateVolunteerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, responsibility } = req.body;

    const updated = await prisma.volunteer.update({
      where: { id: parseInt(id) },
      data: {
        status,
        responsibility,
        updatedAt: new Date()
      },
      include: {
        user: { select: { name: true, email: true } },
        event: { select: { title: true } }
      }
    });

    // Save system notification for the student
    await createNotification(
      updated.userId,
      `Volunteer Application Status Update`,
      `Your application to volunteer for event "${updated.event.title}" has been ${status.toLowerCase()} as "${updated.responsibility || responsibility}".`,
      'SYSTEM',
      '/volunteer'
    );

    // Send styled notification email
    const emailSubject = `Volunteer Application: ${status}`;
    const emailHtml = getHtmlEmailTemplate('PROPOSAL_STATUS_UPDATE' in {} ? 'ANNOUNCEMENT' : 'ANNOUNCEMENT', {
      userName: updated.user.name,
      reminderNotes: `Your application to volunteer for event "${updated.event.title}" has been ${status.toLowerCase()} as "${updated.responsibility}".`
    });
    sendMockEmail(updated.user.email, updated.user.name, emailSubject, emailHtml, 'VOLUNTEER_STATUS').catch(err => {
      console.error('Failed to dispatch volunteer status email:', err.message);
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
