import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';

export const protect = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true, institutionId: true },
    });

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found. Please log in again.' });
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.warn('Auth Error: Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      console.warn('Auth Error: Invalid token structure or signature');
    } else {
      console.error('Auth Error:', error.name, error.message);
    }
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

export const adminAndOrganizer = (req, res, next) => {
  if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'ORGANIZER')) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Not authorized as admin or organizer' });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Not authorized as admin' });
  }
};
