import prisma from '../utils/prisma.js';

export const submitFeedback = async (req, res) => {
  try {
    const { 
      eventId, 
      rating, 
      qualityRating, 
      venueRating, 
      orgRating, 
      timingRating, 
      review, 
      suggestions 
    } = req.body;

    if (!eventId) {
      return res.status(400).json({ success: false, message: 'Event ID is required' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Overall Rating is mandatory and must be between 1 and 5' });
    }

    const existingFeedback = await prisma.feedback.findUnique({
      where: {
        userId_eventId: {
          userId: req.user.id,
          eventId: Number(eventId)
        }
      }
    });

    if (existingFeedback) {
      return res.status(400).json({ success: false, message: 'You have already submitted a review for this event.' });
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId: req.user.id,
        eventId: Number(eventId),
        rating: Number(rating),
        qualityRating: qualityRating ? Number(qualityRating) : 5,
        venueRating: venueRating ? Number(venueRating) : 5,
        orgRating: orgRating ? Number(orgRating) : 5,
        timingRating: timingRating ? Number(timingRating) : 5,
        review: review || null,
        suggestions: suggestions || null
      }
    });

    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    console.error('submitFeedback error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEventFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;
    const feedbacks = await prisma.feedback.findMany({
      where: { eventId: Number(eventId) },
      include: {
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: feedbacks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGlobalFeedbackStats = async (req, res) => {
  try {
    // 1. Best & Worst Rated Events
    const events = await prisma.event.findMany({
      include: {
        feedback: true,
        _count: { select: { feedback: true } }
      }
    });

    const eventStats = events.map(e => {
      const avg = e.feedback.length > 0 
        ? e.feedback.reduce((sum, f) => sum + f.rating, 0) / e.feedback.length 
        : 0;
      return {
        id: e.id,
        name: e.title,
        type: e.type,
        rating: parseFloat(avg.toFixed(1)),
        res: e._count.feedback
      };
    }).filter(e => e.res > 0);

    const bestRated = [...eventStats].sort((a,b) => b.rating - a.rating || b.res - a.res).slice(0, 5);
    const worstRated = [...eventStats].sort((a,b) => a.rating - b.rating || a.res - b.res).slice(0, 5);

    // 2. Average by Type
    const types = [...new Set(events.map(e => e.type || 'Other'))];
    const avgTypeData = types.map(t => {
      const typeEvents = eventStats.filter(e => e.type === t);
      const avg = typeEvents.length > 0 
        ? typeEvents.reduce((sum, e) => sum + e.rating, 0) / typeEvents.length 
        : 0;
      return { type: t, rating: parseFloat(avg.toFixed(1)) };
    }).sort((a,b) => b.rating - a.rating);

    // 3. Overall Distributions & Metrics
    const allFeedback = await prisma.feedback.findMany({});
    const distData = [1, 2, 3, 4, 5].map(star => ({
      star: star.toString(),
      count: allFeedback.filter(f => f.rating === star).length
    }));

    const avgOverall = allFeedback.length > 0 ? (allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length) : 0;
    const avgQuality = allFeedback.length > 0 ? (allFeedback.reduce((sum, f) => sum + f.qualityRating, 0) / allFeedback.length) : 0;
    const avgVenue = allFeedback.length > 0 ? (allFeedback.reduce((sum, f) => sum + f.venueRating, 0) / allFeedback.length) : 0;
    const avgOrg = allFeedback.length > 0 ? (allFeedback.reduce((sum, f) => sum + f.orgRating, 0) / allFeedback.length) : 0;
    const avgTiming = allFeedback.length > 0 ? (allFeedback.reduce((sum, f) => sum + f.timingRating, 0) / allFeedback.length) : 0;

    res.json({
      success: true,
      data: {
        bestRated,
        worstRated,
        avgTypeData,
        distributionData: distData,
        averages: {
          overall: parseFloat(avgOverall.toFixed(1)),
          quality: parseFloat(avgQuality.toFixed(1)),
          venue: parseFloat(avgVenue.toFixed(1)),
          organization: parseFloat(avgOrg.toFixed(1)),
          timing: parseFloat(avgTiming.toFixed(1)),
          totalReviews: allFeedback.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
