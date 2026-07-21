import prisma from '../utils/prisma.js';

export const getBudgets = async (req, res) => {
  try {
    const budgets = await prisma.budget.findMany({
      include: {
        event: { select: { title: true, type: true } }
      }
    });
    res.json({ success: true, data: budgets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addBudget = async (req, res) => {
  try {
    const { eventId, totalBudget, spentAmount } = req.body;

    // Use prisma to stay consistent with the database schema
    const newBudget = await prisma.budget.create({
      data: {
        eventId: parseInt(eventId),
        allocated: parseFloat(totalBudget),
        spent: parseFloat(spentAmount || 0),
        updatedAt: new Date()
      },
      include: {
        event: { select: { title: true } }
      }
    });

    res.status(201).json({
      success: true,
      data: {
        ...newBudget,
        remainingAmount: newBudget.allocated - newBudget.spent
      }
    });
  } catch (error) {
    console.error('Error adding budget:', error);
    res.status(500).json({ success: false, message: 'Error adding budget' });
  }
};

export const updateBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const { allocated, spent } = req.body;

    // Validate spent amount
    if (spent !== undefined && isNaN(parseFloat(spent))) {
      return res.status(400).json({ success: false, message: 'Valid spent amount is required' });
    }

    const updated = await prisma.budget.update({
      where: { id: parseInt(id) },
      data: {
        allocated: allocated ? parseFloat(allocated) : undefined,
        spent: spent !== undefined ? parseFloat(spent) : undefined,
        updatedAt: new Date()
      }
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBudgetByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const budget = await prisma.budget.findFirst({
      where: { eventId: parseInt(eventId) }
    });
    res.json({ success: true, data: budget });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
