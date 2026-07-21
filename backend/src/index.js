import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import institutionRoutes from './routes/institutionRoutes.js';
import participantRoutes from './routes/participantRoutes.js';
import venueRoutes from './routes/venueRoutes.js';
import organizerRoutes from './routes/organizerRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import proposalRoutes from './routes/proposalRoutes.js';
import sponsorRoutes from './routes/sponsorRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import userRoutes from './routes/userRoutes.js';
import winnerRoutes from './routes/winnerRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import { updateDemoUsers } from './utils/startupSync.js';

dotenv.config();

updateDemoUsers();

const app = express();

// Bug 11 Fix: Updated CORS to support LAN/Network access and dynamic origins
const allowedOrigins = [
  'http://localhost:3000',
  /^http:\/\/192\.168\.\d+\.\d+:3000$/,
  /^http:\/\/10\.\d+\.\d+\.\d+:3000$/,
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(pattern => 
      typeof pattern === 'string' ? pattern === origin : pattern.test(origin)
    );

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/organizers', organizerRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/sponsors', sponsorRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/winners', winnerRoutes);
app.use('/api/email', emailRoutes);

// Upgrade 1: Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
