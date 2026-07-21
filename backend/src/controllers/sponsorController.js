import prisma from '../utils/prisma.js';

export const getAllSponsors = async (req, res) => {
  try {
    const sponsors = await prisma.sponsor.findMany({
      include: {
        event: { select: { title: true } }
      },
      orderBy: { contribution: 'desc' }
    });
    res.json({ success: true, data: sponsors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSponsorsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const sponsors = await prisma.sponsor.findMany({
      where: { eventId: parseInt(eventId) },
      orderBy: { contribution: 'desc' }
    });
    res.json({ success: true, data: sponsors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addSponsor = async (req, res) => {
  try {
    const { name, contribution, eventId, logo } = req.body;
    const sponsor = await prisma.sponsor.create({
      data: {
        name,
        contribution: parseFloat(contribution),
        eventId: parseInt(eventId),
        logo
      }
    });
    res.status(201).json({ success: true, data: sponsor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSponsor = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.sponsor.delete({
      where: { id: parseInt(id) }
    });
    res.json({ success: true, message: 'Sponsor removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSponsor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contribution, logo } = req.body;
    const sponsor = await prisma.sponsor.update({
      where: { id: parseInt(id) },
      data: {
        name,
        contribution: contribution ? parseFloat(contribution) : undefined,
        logo
      }
    });
    res.json({ success: true, data: sponsor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
