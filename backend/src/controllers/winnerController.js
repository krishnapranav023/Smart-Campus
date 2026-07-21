import prisma from '../utils/prisma.js';
import { createNotification } from './notificationController.js';

export const getWinners = async (req, res) => {
  try {
    const { eventId, segmentId, position, institutionId, year, search } = req.query;

    const where = {
      ...(eventId && { eventId: parseInt(eventId) }),
      ...(segmentId && { segmentId: parseInt(segmentId) }),
      ...(position && { position: parseInt(position) }),
      ...(year && {
        event: {
          startDate: {
            gte: new Date(`${year}-01-01`),
            lt: new Date(`${parseInt(year) + 1}-01-01`)
          }
        }
      }),
      ...(institutionId && {
        user: {
          institutionId: parseInt(institutionId)
        }
      }),
      ...(search && {
        OR: [
          { user: { name: { contains: search } } },
          { event: { title: { contains: search } } }
        ]
      })
    };

    const winners = await prisma.winner.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            institution: { select: { id: true, name: true, code: true } }
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            startDate: true
          }
        },
        segment: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { event: { startDate: 'desc' } },
        { position: 'asc' }
      ]
    });

    res.json({ success: true, data: winners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addWinner = async (req, res) => {
  try {
    const { userId, eventId, segmentId, position } = req.body;

    const uId = parseInt(userId);
    const eId = parseInt(eventId);
    const sId = parseInt(segmentId);
    const pos = parseInt(position);

    if (!uId || !eId || !sId || !pos) {
      return res.status(400).json({ success: false, message: 'userId, eventId, segmentId, and position are required' });
    }

    if (pos < 1 || pos > 3) {
      return res.status(400).json({ success: false, message: 'Position must be 1 (1st), 2 (2nd), or 3 (3rd)' });
    }

    // 1. Check if user is participant
    const student = await prisma.user.findUnique({ where: { id: uId } });
    if (!student || student.role !== 'PARTICIPANT') {
      return res.status(400).json({ success: false, message: 'Winner must be a student participant' });
    }

    // 2. Check if student is registered for the event
    const registration = await prisma.registration.findFirst({
      where: { userId: uId, eventId: eId }
    });
    if (!registration) {
      return res.status(400).json({ success: false, message: 'Student must be registered for this event to be assigned as a winner' });
    }

    // 3. Check if position already taken for this segment
    const existing = await prisma.winner.findUnique({
      where: {
        segmentId_position: {
          segmentId: sId,
          position: pos
        }
      }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: `Position ${pos} is already assigned for this event segment` });
    }

    const winner = await prisma.winner.create({
      data: {
        userId: uId,
        eventId: eId,
        segmentId: sId,
        position: pos
      },
      include: {
        user: { select: { name: true } },
        event: { select: { title: true } }
      }
    });

    // Notify student about their win
    const suffix = pos === 1 ? '1st Place' : pos === 2 ? '2nd Place' : '3rd Place';
    const title = `🏆 Congratulations! You Won!`;
    const message = `You have been awarded the ${suffix} in the segment of the event "${winner.event.title}".`;
    await createNotification(uId, title, message, 'EVENT', '/certificates');

    res.status(201).json({ success: true, data: winner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkAddWinners = async (req, res) => {
  try {
    const { eventId, segmentId, winners } = req.body;
    const eId = parseInt(eventId);
    const sId = parseInt(segmentId);

    if (!eId || !sId || !Array.isArray(winners) || winners.length === 0) {
      return res.status(400).json({ success: false, message: 'eventId, segmentId, and array of winners are required' });
    }

    const createdWinners = [];

    for (const w of winners) {
      const uId = parseInt(w.userId);
      const pos = parseInt(w.position);

      if (!uId || !pos) continue;

      // Upsert winner for segmentId and position
      const existing = await prisma.winner.findUnique({
        where: {
          segmentId_position: {
            segmentId: sId,
            position: pos
          }
        }
      });

      let winner;
      if (existing) {
        winner = await prisma.winner.update({
          where: { id: existing.id },
          data: { userId: uId, eventId: eId }
        });
      } else {
        winner = await prisma.winner.create({
          data: { userId: uId, eventId: eId, segmentId: sId, position: pos }
        });
      }

      createdWinners.push(winner);

      // Send notification
      const suffix = pos === 1 ? '1st Place (Gold)' : pos === 2 ? '2nd Place (Silver)' : '3rd Place (Bronze)';
      const title = `🏆 Award Declaration: ${suffix}`;
      const message = `You have been awarded ${suffix} for your participation!`;
      await createNotification(uId, title, message, 'EVENT', '/certificates');
    }

    res.status(200).json({ success: true, data: createdWinners });
  } catch (error) {
    console.error('bulkAddWinners error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateWinner = async (req, res) => {
  try {
    const { id } = req.params;
    const winnerId = parseInt(id);
    const { userId, position } = req.body;

    const uId = parseInt(userId);
    const pos = parseInt(position);

    const winner = await prisma.winner.findUnique({ where: { id: winnerId } });
    if (!winner) {
      return res.status(404).json({ success: false, message: 'Winner record not found' });
    }

    // Check position uniqueness if changed
    if (pos && pos !== winner.position) {
      const existing = await prisma.winner.findUnique({
        where: {
          segmentId_position: {
            segmentId: winner.segmentId,
            position: pos
          }
        }
      });
      if (existing) {
        return res.status(400).json({ success: false, message: `Position ${pos} is already assigned for this event segment` });
      }
    }

    const updated = await prisma.winner.update({
      where: { id: winnerId },
      data: {
        userId: uId || undefined,
        position: pos || undefined
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteWinner = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.winner.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: 'Winner record removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
