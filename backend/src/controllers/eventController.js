import prisma from '../utils/prisma.js';
import { createNotification } from './notificationController.js';
import { sendMockEmail, getHtmlEmailTemplate } from '../utils/emailService.js';


export const getEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || undefined;
    const type = req.query.type || undefined;
    const year = req.query.year ? parseInt(req.query.year) : undefined;
    const month = req.query.month ? parseInt(req.query.month) : undefined; // 1-12

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    /**
     * Translates computed frontend status values into Prisma WHERE conditions.
     * Computed statuses are derived from event dates, not the raw DB status column.
     *
     * Rules (mirror of frontend eventStatus.js):
     *   COMPLETED         → endDate < now
     *   REGISTRATION_OPEN → endDate >= now AND startDate <= now+30d AND not CANCELLED
     *   UPCOMING          → endDate >= now AND startDate > now+30d AND not CANCELLED
     *   CANCELLED         → status === 'CANCELLED'
     */
    const buildComputedStatusFilter = (statusStr) => {
      if (!statusStr) return null;
      const statuses = statusStr.split(',').map(s => s.trim());
      const conditions = [];

      for (const s of statuses) {
        if (s === 'COMPLETED') {
          conditions.push({ endDate: { lt: now } });
        } else if (s === 'UPCOMING') {
          conditions.push({
            AND: [
              { endDate: { gte: now } },
              { startDate: { gt: thirtyDaysFromNow } },
              { status: { notIn: ['CANCELLED', 'PROPOSED'] } }
            ]
          });
        } else if (s === 'REGISTRATION_OPEN') {
          conditions.push({
            AND: [
              { endDate: { gte: now } },
              { startDate: { lte: thirtyDaysFromNow } },
              { status: { notIn: ['CANCELLED', 'PROPOSED'] } }
            ]
          });
        } else if (s === 'REGISTRATION_CLOSED') {
          conditions.push({
            AND: [
              { endDate: { gte: now } },
              { status: { notIn: ['CANCELLED', 'PROPOSED'] } }
            ]
          });
        } else if (s === 'CANCELLED') {
          conditions.push({ status: 'CANCELLED' });
        } else {
          conditions.push({ status: s });
        }
      }

      if (conditions.length === 0) return null;
      if (conditions.length === 1) return conditions[0];
      return { OR: conditions };
    };

    const computedStatusFilter = buildComputedStatusFilter(status);

    const andClauses = [];

    // By default, exclude proposed events from the public listing
    if (!status) {
      andClauses.push({ status: { not: 'PROPOSED' } });
    }

    if (search) {
      andClauses.push({
        OR: [
          { title: { contains: search } },
          { description: { contains: search } }
        ]
      });
    }

    if (computedStatusFilter) {
      andClauses.push(computedStatusFilter);
    }

    if (type) {
      andClauses.push({ type });
    }

    if (year && !month) {
      andClauses.push({ startDate: { gte: new Date(`${year}-01-01`) } });
      andClauses.push({ startDate: { lt: new Date(`${year + 1}-01-01`) } });
    } else if (year && month) {
      andClauses.push({ startDate: { gte: new Date(year, month - 1, 1) } });
      andClauses.push({ startDate: { lt: new Date(year, month, 1) } });
    }

    const where = andClauses.length > 0 ? { AND: andClauses } : {};


    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        include: {
          institution: { select: { id: true, name: true, code: true } },
          venue: { select: { id: true, name: true } },
          feedback: { select: { rating: true } },
          _count: { select: { registration: true, segment: true, feedback: true } }
        },
        orderBy: { startDate: 'desc' }
      }),
      prisma.event.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        data: events,
        pagination: { 
          page, 
          limit, 
          total, 
          totalPages: Math.ceil(total / limit) 
        }
      }
    });
  } catch (error) {
    console.error('getEvents error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) },
      include: {
        institution: { select: { id: true, name: true, code: true } },
        venue: { select: { id: true, name: true, capacity: true, location: true } },
        segment: { include: { _count: { select: { winner: true } } } },
        sponsor: { select: { id: true, name: true, contribution: true, logo: true } },
        eventtimeline: { orderBy: { time: 'asc' } },
        eventcoordinator: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } }
          }
        },
        registration: { 
          include: { 
            user: { 
              select: { 
                id: true,
                name: true, 
                email: true, 
                institution: { select: { id: true, name: true } } 
              } 
            } 
          },
          orderBy: { createdAt: 'desc' },
          take: 100
        },
        feedback: { 
          include: { 
            user: { select: { id: true, name: true, email: true } } 
          },
          orderBy: { createdAt: 'desc' }
        },
        winner: { 
          include: { 
            user: { select: { id: true, name: true, email: true } }, 
            segment: { select: { id: true, name: true } } 
          } 
        },
        budget: { select: { id: true, allocated: true, spent: true } },
        media: { select: { id: true, url: true, type: true } },
        _count: { 
          select: { 
            registration: true,
            segment: true,
            feedback: true,
            winner: true,
            sponsor: true
          } 
        }
      }
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.json({ success: true, data: event });
  } catch (error) {
    console.error('getEventById error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createEvent = async (req, res) => {
  try {
    const { 
      title, 
      type, 
      description, 
      startDate, 
      endDate, 
      venueId, 
      institutionId, 
      maxParticipants 
    } = req.body;

    // Validation
    if (!title || !type || !startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: title, type, startDate, endDate' 
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return res.status(400).json({ 
        success: false, 
        message: 'Start date must be before end date' 
      });
    }

    const event = await prisma.event.create({
      data: {
        title: title.trim(),
        type,
        description: description || '',
        startDate: start,
        endDate: end,
        venueId: venueId ? parseInt(venueId) : null,
        institutionId: institutionId ? parseInt(institutionId) : req.user?.institutionId,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : 100,
        status: 'UPCOMING',
        updatedAt: new Date()
      },
      include: {
        institution: { select: { id: true, name: true, code: true } },
        venue: { select: { id: true, name: true } },
        _count: { select: { registration: true } }
      }
    });

    res.status(201).json({ success: true, data: event });
  } catch (error) {
    console.error('createEvent error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const eventId = parseInt(id);

    const { 
      title, 
      type, 
      description, 
      startDate, 
      endDate, 
      status, 
      venueId, 
      institutionId, 
      maxParticipants 
    } = req.body;

    // Check if event exists
    const existing = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Validate dates if both provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start >= end) {
        return res.status(400).json({ 
          success: false, 
          message: 'Start date must be before end date' 
        });
      }
    }

    // Construct clean update data
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    
    if (venueId !== undefined) {
      updateData.venueId = venueId ? parseInt(venueId) : null;
    }
    if (institutionId !== undefined) {
      updateData.institutionId = institutionId ? parseInt(institutionId) : null;
    }
    if (maxParticipants !== undefined) {
      updateData.maxParticipants = parseInt(maxParticipants) || 100;
    }

    updateData.updatedAt = new Date();

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        institution: { select: { id: true, name: true, code: true } },
        venue: { select: { id: true, name: true } },
        _count: { select: { registration: true } }
      }
    });

    // Notify registered participants and coordinators if status changed
    if (status !== undefined && status !== existing.status) {
      const notifyUsers = async () => {
        try {
          const title = `Event Status Update: ${updated.title}`;
          const message = `The event "${updated.title}" status has been changed to ${status.toLowerCase()}.`;

          // Query participants and coordinators
          const registrations = await prisma.registration.findMany({
            where: { eventId },
            select: { userId: true }
          });
          const coordinators = await prisma.eventcoordinator.findMany({
            where: { eventId },
            select: { userId: true }
          });

          // Unique set of user IDs
          const userIdsToNotify = new Set([
            ...registrations.map(r => r.userId),
            ...coordinators.map(c => c.userId)
          ]);

          for (const uId of userIdsToNotify) {
            await createNotification(uId, title, message, 'EVENT', `/events/${eventId}`);
          }
        } catch (err) {
          console.error(`Failed to notify users for event ${eventId} update:`, err);
        }
      };
      // Run async in background
      notifyUsers();
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('updateEvent error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteEvent = async (req, res) => {
  const eventId = parseInt(req.params.id);
  
  try {
    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Delete in reverse dependency order using exact schema model names (lowercase)
    await prisma.eventtimeline.deleteMany({ where: { eventId } });
    await prisma.media.deleteMany({ where: { eventId } });
    await prisma.eventproposal.deleteMany({ where: { eventId } });
    await prisma.feedback.deleteMany({ where: { eventId } });
    await prisma.eventcoordinator.deleteMany({ where: { eventId } });
    await prisma.registration.deleteMany({ where: { eventId } });
    await prisma.winner.deleteMany({ where: { eventId } });
    await prisma.segment.deleteMany({ where: { eventId } });
    await prisma.sponsor.deleteMany({ where: { eventId } });
    await prisma.budget.deleteMany({ where: { eventId } });
    
    // Finally delete the event itself
    await prisma.event.delete({ where: { id: eventId } });
    
    res.json({ success: true, message: 'Event and all related data deleted successfully' });
  } catch (error) {
    console.error('deleteEvent error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const registerForEvent = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);

    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.status !== 'REGISTRATION_OPEN' && event.status !== 'APPROVED' && event.status !== 'UPCOMING') {
      return res.status(400).json({ success: false, message: 'Registration is not open for this event' });
    }

    const regCount = await prisma.registration.count({
      where: { eventId }
    });

    if (regCount >= event.maxParticipants) {
      return res.status(400).json({ success: false, message: 'Event has reached maximum capacity' });
    }

    const existing = await prisma.registration.findFirst({
      where: { userId: req.user.id, eventId }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'You are already registered for this event' });
    }

    const reg = await prisma.registration.create({
      data: {
        userId: req.user.id,
        eventId,
        status: 'PENDING'
      }
    });

    await createNotification(
      req.user.id, 
      'Registration Submitted', 
      `Your registration request for the event "${event.title}" is pending coordinator review.`, 
      'EVENT',
      `/events/${eventId}`
    );

    // Send confirmation email to student
    const student = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { name: true, email: true }
    });
    if (student?.email) {
      const html = getHtmlEmailTemplate('REGISTRATION_CONFIRMATION', { userName: student.name, eventTitle: event.title });
      sendMockEmail(student.email, student.name, `Registration Received: ${event.title}`, html, 'REGISTRATION_CONFIRMATION').catch(() => {});
    }

    res.status(201).json({ success: true, data: reg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelRegistration = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);

    const existing = await prisma.registration.findFirst({
      where: { userId: req.user.id, eventId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    await prisma.registration.delete({
      where: { id: existing.id }
    });

    res.json({ success: true, message: 'Registration cancelled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEventRegistrations = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);

    const registrations = await prisma.registration.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            institution: { select: { name: true, code: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: registrations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRegistrationStatus = async (req, res) => {
  try {
    const regId = parseInt(req.params.regId);
    const { status } = req.body;

    if (!status || !['PENDING', 'APPROVED', 'REJECTED', 'ATTENDED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Valid status is required' });
    }

    const reg = await prisma.registration.findUnique({
      where: { id: regId },
      include: { event: true }
    });

    if (!reg) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    const updated = await prisma.registration.update({
      where: { id: regId },
      data: { status }
    });

    const title = `Registration Status Update`;
    let message = '';
    if (status === 'APPROVED') {
      message = `Your registration request for "${reg.event.title}" has been approved!`;
    } else if (status === 'REJECTED') {
      message = `Your registration request for "${reg.event.title}" has been rejected.`;
    } else if (status === 'ATTENDED') {
      message = `Thank you for attending "${reg.event.title}". You can now review and get your certificate.`;
    } else {
      message = `Your registration request for "${reg.event.title}" is marked as pending.`;
    }

    await createNotification(reg.userId, title, message, 'EVENT', `/events/${reg.eventId}`);

    // Send specific email template based on new status
    const student = await prisma.user.findUnique({ where: { id: reg.userId }, select: { name: true, email: true } });
    if (student?.email) {
      let emailTemplateType = null;
      if (status === 'APPROVED') emailTemplateType = 'REGISTRATION_APPROVED';
      else if (status === 'REJECTED') emailTemplateType = 'REGISTRATION_REJECTED';
      if (emailTemplateType) {
        const html = getHtmlEmailTemplate(emailTemplateType, {
          userName: student.name,
          eventTitle: reg.event.title,
          qrToken: `REG-${regId}-${reg.event.id}-${reg.userId}`
        });
        sendMockEmail(student.email, student.name, `${status === 'APPROVED' ? 'Registration Approved' : 'Registration Update'}: ${reg.event.title}`, html, emailTemplateType).catch(() => {});
      }
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};