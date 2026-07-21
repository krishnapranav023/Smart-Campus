import prisma from '../utils/prisma.js';
import { sendMockEmail, getHtmlEmailTemplate } from '../utils/emailService.js';

// Global SSE connection registry map: userId -> [Response]
const clients = new Map();


export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.update({
      where: { id: parseInt(id) },
      data: { read: true }
    });
    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true }
    });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.notification.delete({
      where: { id: parseInt(id) }
    });
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Internal utility to create notifications, send SSE broadcasts, and trigger email dispatch
export const createNotification = async (userId, title, message, type = 'INFO', actionPath = null) => {
  try {
    const created = await prisma.notification.create({
      data: { userId, title, message, type, actionPath, read: false }
    });

    // 1. Send SSE broadcast in real-time
    const activeClients = clients.get(userId) || [];
    activeClients.forEach(clientRes => {
      clientRes.write(`data: ${JSON.stringify(created)}\n\n`);
    });

    // 2. Dispatch email using proper template based on notification type
    const recipient = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true }
    });

    if (recipient && recipient.email) {
      // Map notification type to email template type
      const templateTypeMap = {
        'ANNOUNCEMENT': 'ANNOUNCEMENT',
        'PROPOSAL': 'PROPOSAL_SUBMITTED',
        'EVENT': 'EVENT_REMINDER',
        'SYSTEM': 'ANNOUNCEMENT',
        'INFO': 'ANNOUNCEMENT'
      };
      const templateType = templateTypeMap[type] || 'ANNOUNCEMENT';
      const emailHtml = getHtmlEmailTemplate(templateType, {
        userName: recipient.name,
        reminderNotes: message
      });

      // Don't await — non-blocking fire-and-forget
      sendMockEmail(recipient.email, recipient.name, `Alert: ${title}`, emailHtml, templateType).catch(err => {
        console.error(`Failed to send email for user ${userId}:`, err.message);
      });
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

// SSE streaming endpoint to push real-time alerts
export const streamNotifications = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // Handshake connection

  const userId = req.user.id;
  if (!clients.has(userId)) {
    clients.set(userId, []);
  }
  clients.get(userId).push(res);

  console.log(`🔌 Client connected to notifications stream. User: ${req.user.name} (ID: ${userId}). Active tabs: ${clients.get(userId).length}`);

  // Heartbeat ping every 25s to prevent cloud provider/browser timeout
  const heartbeat = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    const activeConnections = clients.get(userId) || [];
    const remainingConnections = activeConnections.filter(client => client !== res);
    
    if (remainingConnections.length === 0) {
      clients.delete(userId);
    } else {
      clients.set(userId, remainingConnections);
    }
    console.log(`🔌 Client disconnected. User ID: ${userId}. Remaining tabs: ${remainingConnections.length}`);
  });
};

