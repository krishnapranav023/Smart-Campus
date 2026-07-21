import prisma from '../utils/prisma.js';

export const getVenues = async (req, res) => {
  try {
    const venues = await prisma.venue.findMany({
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: venues });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createVenue = async (req, res) => {
  try {
    const { name, location, capacity } = req.body;
    if (!name || !location || !capacity) {
      return res.status(400).json({ success: false, message: 'Name, Location and Capacity are required' });
    }
    const venue = await prisma.venue.create({
      data: { name, location, capacity: parseInt(capacity) }
    });
    res.status(201).json({ success: true, data: venue });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateVenue = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, capacity } = req.body;
    const venue = await prisma.venue.update({
      where: { id: parseInt(id) },
      data: { name, location, capacity: parseInt(capacity) }
    });
    res.json({ success: true, data: venue });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteVenue = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.venue.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: 'Venue deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
