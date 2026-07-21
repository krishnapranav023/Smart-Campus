import prisma from '../utils/prisma.js';
import { sendMockEmail, getHtmlEmailTemplate } from '../utils/emailService.js';
import { createNotification } from './notificationController.js';

export const getOrganizers = async (req, res) => {
  try {
    const organizers = await prisma.user.findMany({
      where: { role: 'ORGANIZER' },
      include: {
        institution: { select: { name: true } }
      },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: organizers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCoordinatedEvents = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: {
        eventcoordinator: {
          some: { userId: req.user.id }
        }
      },
      include: {
        institution: { select: { id: true, name: true, code: true } },
        venue: { select: { id: true, name: true } },
        _count: { select: { registration: true, segment: true } }
      },
      orderBy: { startDate: 'desc' }
    });
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrganizerDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Coordinated events count
    const coordinatedCount = await prisma.event.count({
      where: { eventcoordinator: { some: { userId } } }
    });

    // Total registrations
    const regCount = await prisma.registration.count({
      where: {
        event: { eventcoordinator: { some: { userId } } }
      }
    });

    // Pending registrations count
    const pendingCount = await prisma.registration.count({
      where: {
        status: 'PENDING',
        event: { eventcoordinator: { some: { userId } } }
      }
    });

    // Feedbacks & Average rating
    const feedbacks = await prisma.feedback.findMany({
      where: {
        event: { eventcoordinator: { some: { userId } } }
      },
      select: { 
        id: true,
        rating: true, 
        qualityRating: true,
        venueRating: true,
        orgRating: true,
        timingRating: true,
        review: true,
        suggestions: true,
        createdAt: true,
        event: { select: { id: true, title: true } },
        user: { select: { id: true, name: true, email: true } }
      }
    });

    const avgRating = feedbacks.length > 0 ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length : 0;
    const avgQuality = feedbacks.length > 0 ? feedbacks.reduce((sum, f) => sum + f.qualityRating, 0) / feedbacks.length : 0;
    const avgVenue = feedbacks.length > 0 ? feedbacks.reduce((sum, f) => sum + f.venueRating, 0) / feedbacks.length : 0;
    const avgOrg = feedbacks.length > 0 ? feedbacks.reduce((sum, f) => sum + f.orgRating, 0) / feedbacks.length : 0;
    const avgTiming = feedbacks.length > 0 ? feedbacks.reduce((sum, f) => sum + f.timingRating, 0) / feedbacks.length : 0;

    const breakdownAverages = {
      overall: parseFloat(avgRating.toFixed(1)),
      quality: parseFloat(avgQuality.toFixed(1)),
      venue: parseFloat(avgVenue.toFixed(1)),
      organization: parseFloat(avgOrg.toFixed(1)),
      timing: parseFloat(avgTiming.toFixed(1)),
    };

    // Pending registrations details
    const pendingRegistrations = await prisma.registration.findMany({
      where: {
        status: 'PENDING',
        event: { eventcoordinator: { some: { userId } } }
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, institution: { select: { name: true } } }
        },
        event: {
          select: { id: true, title: true }
        }
      },
      orderBy: { createdAt: 'asc' },
      take: 20
    });

    // Coordinated events timeline (recent 10)
    const coordinatedEvents = await prisma.event.findMany({
      where: { eventcoordinator: { some: { userId } } },
      include: {
        venue: { select: { name: true } },
        institution: { select: { name: true } },
        _count: { select: { registration: true } }
      },
      orderBy: { startDate: 'desc' },
      take: 10
    });

    // Proposals timeline
    const proposals = await prisma.eventproposal.findMany({
      where: { organizerId: userId },
      include: {
        event: {
          include: {
            venue: { select: { name: true } },
            institution: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // All registrations for coordinated events (for participant list & report exports)
    const allRegistrations = await prisma.registration.findMany({
      where: {
        event: { eventcoordinator: { some: { userId } } }
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, institution: { select: { name: true } } }
        },
        event: {
          select: { id: true, title: true, startDate: true, venue: { select: { name: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // All winners for coordinated events (for report exports)
    const allWinners = await prisma.winner.findMany({
      where: {
        event: { eventcoordinator: { some: { userId } } }
      },
      include: {
        user: { select: { name: true, email: true, institution: { select: { name: true, code: true } } } },
        event: { select: { title: true } },
        segment: { select: { name: true } }
      }
    });

    // Coordinated budgets (for interactive graphs/oversight)
    const budgets = await prisma.budget.findMany({
      where: {
        event: { eventcoordinator: { some: { userId } } }
      },
      include: {
        event: { select: { id: true, title: true } }
      }
    });

    res.json({
      success: true,
      data: {
        kpis: {
          coordinatedEventsCount: coordinatedCount,
          totalRegistrations: regCount,
          pendingRegistrationsCount: pendingCount,
          averageFeedbackRating: parseFloat(avgRating.toFixed(1)),
          breakdownAverages
        },
        pendingRegistrations,
        coordinatedEvents,
        proposals,
        feedbacks,
        allRegistrations,
        allWinners,
        budgets
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCoordinatedFeedback = async (req, res) => {
  try {
    const feedbackList = await prisma.feedback.findMany({
      where: {
        event: { eventcoordinator: { some: { userId: req.user.id } } }
      },
      include: {
        user: { select: { name: true, email: true } },
        event: { select: { title: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: feedbackList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendEventAnnouncement = async (req, res) => {
  try {
    const { eventId, subject, message } = req.body;

    const registrations = await prisma.registration.findMany({
      where: {
        eventId: parseInt(eventId),
        status: 'APPROVED'
      },
      include: {
        user: { select: { name: true, email: true } }
      }
    });

    const event = await prisma.event.findUnique({
      where: { id: parseInt(eventId) }
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    let count = 0;
    const formattedDate = event.startDate ? new Date(event.startDate).toLocaleDateString('en-GB') : 'Upcoming';
    for (const reg of registrations) {
      if (reg.user && reg.user.email) {
        const studentHtml = getHtmlEmailTemplate('EVENT_REMINDER', {
          userName: reg.user.name,
          eventTitle: event.title,
          eventDate: formattedDate,
          venueName: '',
          reminderNotes: message
        });
        
        await sendMockEmail(reg.user.email, reg.user.name, subject, studentHtml);
        count++;

        // Trigger system notification + real-time SSE stream to participant
        await createNotification(
          reg.userId,
          `Announcement: ${event.title}`,
          message,
          'ANNOUNCEMENT',
          `/events/${eventId}`
        );
      }
    }

    res.json({ success: true, message: `Announcement email successfully broadcasted to ${count} students.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
