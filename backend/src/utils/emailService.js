import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import prisma from './prisma.js';

// Setup Nodemailer dynamic SMTP transporter from env variables
const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port: parseInt(port),
      secure: port == 465,
      auth: { user, pass }
    });
  }
  return null;
};

/**
 * Common HTML email wrapper to apply consistent premium styling
 */
const wrapHtmlEmail = (title, bodyHtml, actionUrl = '#', actionText = '') => {
  const primaryColor = '#4f46e5'; // Premium Indigo
  const buttonHtml = actionText ? `
    <table border="0" cellpadding="0" cellspacing="0" style="margin: 24px auto 0 auto;">
      <tr>
        <td align="center" bgcolor="${primaryColor}" style="border-radius: 8px;">
          <a href="${actionUrl}" target="_blank" style="font-size: 14px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; border-radius: 8px; padding: 12px 28px; border: 1px solid ${primaryColor}; display: inline-block; font-weight: bold; letter-spacing: 0.05em;">
            ${actionText}
          </a>
        </td>
      </tr>
    </table>
  ` : '';

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #f1f5f9;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            border: 1px solid #e2e8f0;
          }
          .header {
            background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
            padding: 32px 24px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            color: #ffffff;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.025em;
          }
          .content {
            padding: 40px 32px;
            line-height: 1.6;
            font-size: 15px;
          }
          .footer {
            background-color: #f8fafc;
            padding: 24px;
            text-align: center;
            border-top: 1px solid #f1f5f9;
            font-size: 12px;
            color: #64748b;
          }
          .footer a {
            color: #4f46e5;
            text-decoration: none;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${title}</h1>
          </div>
          <div class="content">
            ${bodyHtml}
            ${buttonHtml}
          </div>
          <div class="footer">
            <p>You received this email because you are registered on the <strong>Inter-Collegiate Event Portal</strong>.</p>
            <p>&copy; ${new Date().getFullYear()} SCSVMV & SRM Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

/**
 * Returns compiled responsive HTML template with inline styled layout for all 14 types
 */
export const getHtmlEmailTemplate = (type, data = {}) => {
  const {
    userName = 'Participant',
    eventTitle = '',
    eventDate = '',
    venueName = '',
    qrToken = '',
    reason = '',
    segmentName = '',
    position = 1,
    prizeText = '',
    certificateUrl = '#',
    feedbackUrl = '#',
    reminderNotes = '',
    proposalTitle = '',
    status = '',
    comments = '',
    resetUrl = '#'
  } = data;

  let title = '';
  let bodyHtml = '';
  let actionUrl = '#';
  let actionText = '';

  switch (type) {
    case 'WELCOME':
      title = 'Welcome to the Event Portal';
      bodyHtml = `
        <p>Dear <strong>${userName}</strong>,</p>
        <p>Welcome to the <strong>Inter-Collegiate Event Portal</strong>! We are thrilled to have you join our academic events and innovation community.</p>
        <p>You can now browse upcoming events, register entry passes, track volunteer opportunities, and review your competition results across participating colleges.</p>
        <p>Log in to complete your profile, check available events, and start participating today!</p>
      `;
      actionUrl = 'http://localhost:3000/dashboard';
      actionText = 'Explore Dashboard';
      break;

    case 'REGISTRATION_CONFIRMATION':
      title = 'Registration Received';
      bodyHtml = `
        <p>Dear <strong>${userName}</strong>,</p>
        <p>Your registration for the event <strong>"${eventTitle}"</strong> has been received successfully!</p>
        <p>Our team is currently reviewing your registration details. We will notify you as soon as the status is updated.</p>
      `;
      actionUrl = 'http://localhost:3000/dashboard';
      actionText = 'View Schedule';
      break;

    case 'REGISTRATION_APPROVED':
      title = 'Registration Approved!';
      bodyHtml = `
        <p>Dear <strong>${userName}</strong>,</p>
        <p>Congratulations! Your registration for <strong>"${eventTitle}"</strong> has been approved by the event coordinator.</p>
        <p><strong>Your Digital Entry Pass Details:</strong></p>
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0; font-family: monospace; font-size: 14px; text-align: center;">
          Pass Code Token: <strong>${qrToken}</strong>
        </div>
        <p>Please log in to your dashboard to display or download your entry QR code, which will be scanned at the venue entrance.</p>
      `;
      actionUrl = 'http://localhost:3000/dashboard';
      actionText = 'View Entry Pass';
      break;

    case 'REGISTRATION_REJECTED':
      title = 'Registration Not Approved';
      bodyHtml = `
        <p>Dear <strong>${userName}</strong>,</p>
        <p>Your registration for the event <strong>"${eventTitle}"</strong> could not be approved at this time.</p>
        <p><strong>Reason:</strong> ${reason || 'Incomplete registration details or capacity limits reached.'}</p>
        <p>If you have any questions, please contact the coordinator or check other active events.</p>
      `;
      actionUrl = 'http://localhost:3000/events';
      actionText = 'Browse Other Events';
      break;

    case 'EVENT_REMINDER':
      title = 'Event Reminder Alert';
      bodyHtml = `
        <p>Dear <strong>${userName}</strong>,</p>
        <p>This is a quick reminder that <strong>"${eventTitle}"</strong> is coming up soon!</p>
        <p><strong>Event Schedule:</strong></p>
        <ul>
          <li><strong>Date:</strong> ${eventDate}</li>
          <li><strong>Venue:</strong> ${venueName || 'Main Campus Hall'}</li>
        </ul>
        ${reminderNotes ? `<p><strong>Important Coordinator Notes:</strong><br/>${reminderNotes}</p>` : ''}
        <p>Please make sure to have your entry pass QR code ready on your phone when arriving.</p>
      `;
      actionUrl = 'http://localhost:3000/dashboard';
      actionText = 'Check Pass Code';
      break;

    case 'EVENT_CANCELLATION':
      title = 'Event Cancellation Notice';
      bodyHtml = `
        <p>Dear <strong>${userName}</strong>,</p>
        <p>We regret to inform you that the event <strong>"${eventTitle}"</strong> has been cancelled by the coordinators.</p>
        <p><strong>Reason:</strong> ${reason || 'Unforeseen administrative circumstances.'}</p>
        <p>Any registration slots or volunteer duties are automatically voided. We apologize for the inconvenience.</p>
      `;
      actionUrl = 'http://localhost:3000/events';
      actionText = 'Explore Events';
      break;

    case 'WINNER_ANNOUNCEMENT':
      title = 'Congratulations! Winner Announcement';
      bodyHtml = `
        <p>Dear <strong>${userName}</strong>,</p>
        <p>Fantastic news! You have secured <strong>Rank #${position}</strong> in the segment <strong>"${segmentName}"</strong> of the event <strong>"${eventTitle}"</strong>!</p>
        ${prizeText ? `<p><strong>Award Details:</strong> ${prizeText}</p>` : ''}
        <p>We applaud your stellar performance! Your certificate of excellence will be available shortly on the portal.</p>
      `;
      actionUrl = 'http://localhost:3000/winners';
      actionText = 'View Winners Table';
      break;

    case 'CERTIFICATE_AVAILABLE':
      title = 'Participation Certificate Available';
      bodyHtml = `
        <p>Dear <strong>${userName}</strong>,</p>
        <p>Your digital e-certificate for participating in <strong>"${eventTitle}"</strong> is ready!</p>
        <p>You can download the verified certificate file directly from your portal dashboard under your profile accomplishments.</p>
      `;
      actionUrl = certificateUrl || 'http://localhost:3000/dashboard';
      actionText = 'Download Certificate';
      break;

    case 'FEEDBACK_REQUEST':
      title = 'Share Your Feedback';
      bodyHtml = `
        <p>Dear <strong>${userName}</strong>,</p>
        <p>We hope you had a great experience at <strong>"${eventTitle}"</strong>!</p>
        <p>Please take 2 minutes to rate and review the event. Your suggestions are vital for improving our future college event sessions.</p>
      `;
      actionUrl = feedbackUrl || 'http://localhost:3000/dashboard';
      actionText = 'Submit Feedback';
      break;

    case 'PROPOSAL_SUBMITTED':
      title = 'New Event Proposal Submitted';
      bodyHtml = `
        <p>Dear Admin,</p>
        <p>A new event proposal titled <strong>"${proposalTitle}"</strong> has been submitted by the college event coordinator.</p>
        <p>Please log in to the administrator control panel to review the budget, venue details, and approve/reject the proposal.</p>
      `;
      actionUrl = 'http://localhost:3000/proposals';
      actionText = 'Review Proposals';
      break;

    case 'PROPOSAL_APPROVED':
      title = 'Event Proposal Approved!';
      bodyHtml = `
        <p>Dear Coordinator,</p>
        <p>Great news! Your event proposal <strong>"${proposalTitle}"</strong> has been reviewed and approved by the administrators.</p>
        <p>The event is now active on the portal and open for student registrations.</p>
      `;
      actionUrl = 'http://localhost:3000/dashboard';
      actionText = 'Manage Event';
      break;

    case 'PROPOSAL_REJECTED':
      title = 'Event Proposal Not Approved';
      bodyHtml = `
        <p>Dear Coordinator,</p>
        <p>Your event proposal <strong>"${proposalTitle}"</strong> could not be approved at this time.</p>
        <p><strong>Review Comments:</strong></p>
        <p style="background-color: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; color: #dc2626;">
          ${comments || 'Budget adjustment or scheduling conflict.'}
        </p>
      `;
      actionUrl = 'http://localhost:3000/dashboard';
      actionText = 'Open Dashboard';
      break;

    case 'PASSWORD_RESET':
      title = 'Reset Your Password';
      bodyHtml = `
        <p>Dear <strong>${userName}</strong>,</p>
        <p>You requested to reset your account password. Click the button below to set a new password.</p>
        <p>If you did not make this request, you can safely ignore this email; your credentials remain secure.</p>
      `;
      actionUrl = resetUrl || 'http://localhost:3000/settings';
      actionText = 'Reset Password';
      break;

    case 'ANNOUNCEMENT':
      title = 'Important Event Announcement';
      bodyHtml = `
        <p>Dear <strong>${userName}</strong>,</p>
        <p>The coordinator of the event <strong>"${eventTitle}"</strong> has posted a new announcement:</p>
        <p style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 0 8px 8px 0; color: #1e3a8a;">
          ${reminderNotes}
        </p>
      `;
      actionUrl = 'http://localhost:3000/dashboard';
      actionText = 'Open Portal';
      break;

    default:
      title = 'Portal Notification';
      bodyHtml = `<p>You have a new alert: ${reminderNotes}</p>`;
  }

  return wrapHtmlEmail(title, bodyHtml, actionUrl, actionText);
};

/**
 * Production-ready email dispatcher with Nodemailer SMTP client and prisma logging
 */
export const sendMockEmail = async (toEmail, toName, subject, htmlContent, emailType = 'UNKNOWN') => {
  const timestamp = new Date();
  console.log(`✉️  [EMAIL INITIATED] To: ${toName} <${toEmail}> | Type: ${emailType} | Subject: ${subject}`);
  
  let deliveryStatus = 'SUCCESS';
  let errMsg = null;

  const smtpFrom = process.env.SMTP_FROM || '"Inter-Collegiate Event Portal" <no-reply@scsvmv.edu.in>';
  const transporter = getTransporter();

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: smtpFrom,
        to: `"${toName}" <${toEmail}>`,
        subject: subject,
        html: htmlContent
      });
      console.log(`🚀 [SMTP DISPATCH SUCCESS] Message ID: ${info.messageId}`);
    } catch (smtpErr) {
      deliveryStatus = 'FAILED';
      errMsg = smtpErr.message;
      console.error('SMTP Dispatch Failed:', smtpErr.message);
    }
  } else {
    console.log(`ℹ️ [MOCK MODE] SMTP not configured. Writing to local mock_emails.log file.`);
    
    // Fallback: Write locally
    const logDir = 'c:/Users/krish/MultiInstitutionPlatform/backend/scratch';
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const logFilePath = path.join(logDir, 'mock_emails.log');
    const logEntry = `
=========================================
TIMESTAMP: ${timestamp.toISOString()}
TO: ${toName} <${toEmail}>
TYPE: ${emailType}
SUBJECT: ${subject}
-----------------------------------------
HTML BODY:
${htmlContent}
=========================================
\n`;
    try {
      fs.appendFileSync(logFilePath, logEntry, 'utf8');
    } catch (fsErr) {
      console.error('Failed to log email locally:', fsErr.message);
    }
  }

  // Save detailed database logging to emaillog model
  try {
    await prisma.emaillog.create({
      data: {
        recipient: `${toName} <${toEmail}>`,
        emailType: emailType,
        status: deliveryStatus,
        errorMessage: errMsg,
        timestamp: timestamp
      }
    });
  } catch (dbErr) {
    console.error('Failed to write email log to database:', dbErr.message);
  }

  if (deliveryStatus === 'FAILED') {
    throw new Error(errMsg || 'SMTP delivery failed');
  }

  return true;
};
