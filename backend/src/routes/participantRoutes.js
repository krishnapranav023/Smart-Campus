import express from 'express';
import prisma from '../utils/prisma.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const participants = await prisma.user.findMany({
      where: { role: 'PARTICIPANT' },
      include: {
        institution: { select: { name: true, code: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 200
    });
    
    res.json({ success: true, data: participants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/leaderboard', async (req, res) => {
  try {
    const participants = await prisma.user.findMany({
      where: { role: 'PARTICIPANT' },
      include: {
        institution: { select: { name: true } },
        _count: { select: { winner: true, registration: true } }
      }
    });

    const ranked = participants.map(p => ({
      id: p.id,
      name: p.name,
      institution: p.institution?.name || 'Unknown',
      wins: p._count.winner,
      participations: p._count.registration,
      score: (p._count.winner * 10) + (p._count.registration * 3),
    }))
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);

    res.json({ success: true, data: ranked });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/my-registrations', async (req, res) => {
  try {
    const registrations = await prisma.registration.findMany({
      where: { userId: req.user.id },
      include: {
        event: {
          include: {
            institution: { select: { name: true } },
            venue: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: registrations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/my-wins', async (req, res) => {
  try {
    const wins = await prisma.winner.findMany({
      where: { userId: req.user.id },
      include: {
        event: { select: { id: true, title: true, startDate: true } },
        segment: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: wins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/my-rank', async (req, res) => {
  try {
    const participants = await prisma.user.findMany({
      where: { role: 'PARTICIPANT' },
      include: {
        _count: { select: { winner: true, registration: true } }
      }
    });
    const ranked = participants.map(p => ({
      id: p.id,
      score: (p._count.winner * 10) + (p._count.registration * 3),
    })).sort((a, b) => b.score - a.score);
    
    const rank = ranked.findIndex(p => p.id === req.user.id) + 1;
    res.json({ success: true, data: { rank, total: ranked.length } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/dashboard-stats', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const totalRegistrations = await prisma.registration.count({ where: { userId } });
    const winsCount = await prisma.winner.count({ where: { userId } });
    
    const upcomingEvents = await prisma.event.findMany({
      where: {
        status: 'REGISTRATION_OPEN',
        startDate: { gte: new Date() }
      },
      include: {
        institution: { select: { name: true } },
        venue: { select: { name: true } }
      },
      take: 6,
      orderBy: { startDate: 'asc' }
    });
    
    const registeredEvents = await prisma.registration.findMany({
      where: { userId },
      include: {
        event: {
          include: {
            institution: { select: { name: true } },
            venue: { select: { name: true } }
          }
        }
      },
      orderBy: { event: { startDate: 'asc' } },
      take: 10
    });
    
    const achievements = await prisma.winner.findMany({
      where: { userId },
      include: {
        event: { select: { title: true } },
        segment: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Leaderboard Rank
    const participants = await prisma.user.findMany({
      where: { role: 'PARTICIPANT' },
      include: {
        _count: { select: { winner: true, registration: true } }
      }
    });
    const ranked = participants.map(p => ({
      id: p.id,
      score: (p._count.winner * 10) + (p._count.registration * 3),
    })).sort((a, b) => b.score - a.score);
    const rank = ranked.findIndex(p => p.id === userId) + 1;

    res.json({
      success: true,
      data: {
        kpis: {
          registeredCount: totalRegistrations,
          winsCount,
          leaderboardRank: rank,
          leaderboardTotal: ranked.length
        },
        upcomingEvents,
        registeredEvents,
        achievements
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

import { applyToVolunteer, getMyVolunteering } from '../controllers/volunteerController.js';

router.post('/apply-volunteer', applyToVolunteer);
router.get('/my-volunteering', getMyVolunteering);

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const participant = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        institution: { select: { name: true, code: true } },
        _count: { select: { winner: true, registration: true } }
      }
    });

    if (!participant || participant.role !== 'PARTICIPANT') {
      return res.status(404).json({ success: false, message: 'Participant not found' });
    }
    
    res.json({ success: true, data: participant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (req.user.role !== 'ADMIN' && req.user.id !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this profile' });
    }

    const { name, email, institutionId, phone, about } = req.body;
    
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { 
        name, 
        email, 
        phone,
        about,
        institutionId: institutionId ? parseInt(institutionId) : undefined,
        updatedAt: new Date()
      },
      include: {
        institution: { select: { name: true } }
      }
    });
    
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: 'Participant deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
