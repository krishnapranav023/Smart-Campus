import prisma from '../utils/prisma.js';

export const getLeaderboard = async (req, res) => {
  try {
    const institutions = await prisma.institution.findMany({
      include: {
        _count: {
          select: { event: true, user: true }
        },
        user: {
          include: {
            _count: { select: { winner: true } }
          }
        }
      }
    });

    const leaderboard = institutions.map(inst => {
      // Calculate total wins associated with users from this institution
      const totalWins = inst.user.reduce((acc, u) => acc + (u._count?.winner || 0), 0);
      
      // Points distribution: Participation = 1pt, Wins = 5pts
      const score = (inst._count.user * 1) + (totalWins * 5);

      return {
        id: inst.id,
        name: inst.name,
        code: inst.code,
        participants: inst._count.user,
        wins: totalWins,
        score
      };
    });

    // Sort by descending score
    leaderboard.sort((a, b) => b.score - a.score);

    res.json({ success: true, data: leaderboard });
  } catch (error) {
    console.error('Leaderboard Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
