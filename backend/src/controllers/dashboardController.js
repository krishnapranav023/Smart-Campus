import prisma from '../utils/prisma.js';

export const getGlobalStats = async (req, res) => {
  try {
    const totalInstitutions = await prisma.institution.count();
    const totalEvents = await prisma.event.count();
    const totalParticipants = await prisma.user.count({ where: { role: 'PARTICIPANT' } });
    const totalWinners = await prisma.winner.count();

    // Active events are specifically those scheduled for the current season (2026)
    const activeEventsCount = await prisma.event.count({
      where: {
        startDate: {
          gte: new Date('2026-01-01T00:00:00Z'),
          lte: new Date('2026-12-31T23:59:59Z')
        },
        status: {
          not: 'CANCELLED'
        }
      }
    });

    // Compute aggregate financial data (Mocked or real based on table availability)
    const budgets = await prisma.budget.findMany({ select: { allocated: true, spent: true } });
    const totalAllocated = budgets.reduce((sum, b) => sum + (b.allocated || 0), 0);
    const totalSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0);
    
    const sponsors = await prisma.sponsor.findMany({ select: { contribution: true } });
    const totalSponsorship = sponsors.reduce((sum, s) => sum + (s.contribution || 0), 0);
    
    const proposals = await prisma.eventproposal.count({ where: { status: 'PENDING' } });

    res.json({
      success: true,
      data: {
        totalInstitutions,
        totalEvents,
        totalParticipants,
        totalWinners,
        activeEventsCount,
        totalBudget: totalAllocated,
        totalSpent,
        totalSponsorship,
        pendingProposals: proposals
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInstitutionStats = async (req, res) => {
  try {
    const stats = await prisma.institution.findMany({
      include: {
        _count: {
          select: { user: true, event: true }
        }
      }
    });
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
