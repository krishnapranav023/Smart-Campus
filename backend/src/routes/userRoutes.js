import express from 'express';
import prisma from '../utils/prisma.js';
import { protect, adminOnly as admin } from '../middlewares/authMiddleware.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Get all users
router.get('/', protect, admin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        institution: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new user
router.post('/', protect, admin, async (req, res) => {
  try {
    const { name, email, role, institutionId } = req.body;
    
    const hashedPassword = await bcrypt.hash('defaultPassword123', 10);
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'PARTICIPANT',
        institutionId: institutionId ? parseInt(institutionId) : null
      },
      include: {
        institution: { select: { id: true, name: true } }
      }
    });
    
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update current user's profile
router.put('/me', protect, async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.id;

    // Check if email already exists for another user
    if (email) {
      const existing = await prisma.user.findFirst({
        where: { email, NOT: { id: userId } }
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { name, email },
      include: { institution: { select: { id: true, name: true } } }
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Change current user's password
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user (admin only)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, institutionId } = req.body;
    
    const updated = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { 
        name, 
        email, 
        role, 
        institutionId: institutionId ? parseInt(institutionId) : null 
      },
      include: {
        institution: { select: { id: true, name: true } }
      }
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete user (admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;