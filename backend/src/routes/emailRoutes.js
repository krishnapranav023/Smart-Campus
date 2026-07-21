import express from 'express';
import nodemailer from 'nodemailer';
import prisma from '../utils/prisma.js';
import { sendMockEmail, getHtmlEmailTemplate } from '../utils/emailService.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All email routes require authentication
router.use(protect);

// GET /api/email/status — Check SMTP connection status
router.get('/status', adminOnly, async (req, res) => {
  try {
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpPort = process.env.SMTP_PORT || 587;
    const smtpFrom = process.env.SMTP_FROM || 'no-reply@scsvmv.edu.in';

    if (!smtpHost || !smtpUser || !smtpPass) {
      return res.json({ 
        success: true, 
        data: { 
          configured: false, 
          status: 'NOT_CONFIGURED',
          message: 'SMTP environment variables (SMTP_HOST, SMTP_USER, SMTP_PASS) are not set. Running in mock/local log mode.',
          smtpFrom,
          mockLogPath: 'backend/scratch/mock_emails.log'
        } 
      });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: smtpPort == 465,
      auth: { user: smtpUser, pass: smtpPass }
    });

    await transporter.verify();

    res.json({ 
      success: true, 
      data: { 
        configured: true,
        status: 'CONNECTED',
        message: `SMTP successfully connected to ${smtpHost}:${smtpPort}`,
        smtpHost,
        smtpPort,
        smtpUser,
        smtpFrom
      } 
    });
  } catch (err) {
    res.json({ 
      success: true, 
      data: { 
        configured: true,
        status: 'ERROR',
        message: `SMTP connection failed: ${err.message}`,
      } 
    });
  }
});

// POST /api/email/send-test — Send a test email to any recipient
router.post('/send-test', adminOnly, async (req, res) => {
  try {
    const { recipientEmail, recipientName = 'Test Recipient', emailType = 'WELCOME' } = req.body;

    if (!recipientEmail) {
      return res.status(400).json({ success: false, message: 'Recipient email is required' });
    }

    const htmlContent = getHtmlEmailTemplate(emailType, {
      userName: recipientName,
      eventTitle: 'Sample Test Event',
      eventDate: new Date().toLocaleDateString('en-GB'),
      venueName: 'Campus Auditorium',
      qrToken: 'REG-001-100-500',
      proposalTitle: 'Sample Event Proposal',
      reminderNotes: 'This is a test email dispatch from the Event Portal Admin testing console.',
      segmentName: 'Technical Quiz',
      position: 1,
      prizeText: '₹5,000 cash prize + Trophy',
      comments: 'All conditions satisfied.',
      status: 'APPROVED'
    });

    const subject = `[Test] ${emailType.replace(/_/g, ' ')} — Event Portal`;
    await sendMockEmail(recipientEmail, recipientName, subject, htmlContent, emailType);

    res.json({ success: true, message: `Test email dispatched to ${recipientEmail}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/email/preview/:type — Return compiled HTML for a given template type
router.get('/preview/:type', adminOnly, async (req, res) => {
  try {
    const emailType = req.params.type.toUpperCase();
    const htmlContent = getHtmlEmailTemplate(emailType, {
      userName: 'Preview User',
      eventTitle: 'Sample College Technical Fest',
      eventDate: new Date().toLocaleDateString('en-GB'),
      venueName: 'Grand Hall, Main Campus',
      qrToken: 'REG-123-456-789',
      proposalTitle: 'Annual Cultural Extravaganza 2025',
      reminderNotes: 'Please arrive 30 minutes early for registration verification.',
      segmentName: 'Debate Championship',
      position: 1,
      prizeText: '₹10,000 + Trophy',
      comments: 'Approved after full review of the event budget allocation.',
      status: 'APPROVED',
      resetUrl: 'http://localhost:3000/settings'
    });
    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);
  } catch (err) {
    res.status(400).json({ success: false, message: `Invalid email type: ${req.params.type}` });
  }
});

// GET /api/email/logs — Retrieve email delivery log history
router.get('/logs', adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.emaillog.findMany({
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip
      }),
      prisma.emaillog.count()
    ]);

    res.json({ success: true, data: logs, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/email/logs — Clear email delivery log history
router.delete('/logs', adminOnly, async (req, res) => {
  try {
    await prisma.emaillog.deleteMany({});
    res.json({ success: true, message: 'Email log history cleared successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
