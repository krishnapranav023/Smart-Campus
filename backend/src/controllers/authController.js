import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.js';
import { generateToken } from '../utils/jwt.js';

export const registerUser = async (req, res) => {
  const { name, email, password, institutionId, role } = req.body;

  try {
    const userExists = await prisma.user.findUnique({ where: { email } });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Validate institutionId
    if (!institutionId || isNaN(Number(institutionId))) {
      return res.status(400).json({ success: false, message: 'Valid institutionId is required' });
    }

    const assignedRole = (role && ['ADMIN', 'ORGANIZER', 'PARTICIPANT'].includes(role.toUpperCase())) 
      ? role.toUpperCase() 
      : 'PARTICIPANT';

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: assignedRole,
        institutionId: parseInt(institutionId),
        updatedAt: new Date()
      },
    });

    const token = generateToken(user.id, user.role, user.institutionId);
    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        institutionId: user.institutionId,
        createdAt: user.createdAt,
        token,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ 
        where: { email },
        include: { institution: true }
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = generateToken(user.id, user.role, user.institutionId);
      res.json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          institutionId: user.institutionId,
          institutionName: user.institution?.name,
          createdAt: user.createdAt,
          token,
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
