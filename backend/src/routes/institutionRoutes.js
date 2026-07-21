import express from 'express';
import prisma from '../utils/prisma.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const institutions = await prisma.institution.findMany({
      include: {
        _count: {
          select: { event: true, user: true }
        }
      }
    });

    const instData = await Promise.all(institutions.map(async (inst) => {
      // Find all participants of this institution
      const usersList = await prisma.user.findMany({ where: { institutionId: inst.id }, select: { id: true } });
      const userIds = usersList.map(u => u.id);
      
      const wins = await prisma.winner.count({
        where: { userId: { in: userIds } }
      });

      return {
        ...inst,
        eventsCount: inst._count.event,
        participantsCount: inst._count.user,
        winsCount: wins || 0
      };
    }));

    res.json({ success: true, data: instData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const institution = await prisma.institution.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, createdAt: true }
        },
        event: {
          include: {
            _count: { select: { registration: true } }
          },
          orderBy: { startDate: 'desc' }
        },
        _count: {
          select: { event: true, user: true }
        }
      }
    });

    if (!institution) return res.status(404).json({ success: false, message: 'Institution not found' });

    // Compute wins
    const userIds = institution.user.map(u => u.id);
    const winsCount = await prisma.winner.count({ where: { userId: { in: userIds } } });

    res.json({ 
      success: true, 
      data: { 
        ...institution, 
        winsCount, 
        eventsCount: institution._count.event, 
        participantsCount: institution._count.user 
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, location } = req.body;
    const updated = await prisma.institution.update({
      where: { id: parseInt(id) },
      data: { name, code, location, updatedAt: new Date() }
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.institution.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: 'Institution deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', adminOnly, async (req, res) => {
  try {
    const { name, code, location } = req.body;
    const inst = await prisma.institution.create({ 
      data: { name, code, location, updatedAt: new Date() } 
    });
    res.status(201).json({ success: true, data: inst });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
