import { PrismaClient } from '@prisma/client';
import { createNotification } from '../controllers/notificationController.js';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function runTest() {
  console.log('🔄 Running automated notification & email simulation test...');

  try {
    // 1. Get a test user from the database
    const testUser = await prisma.user.findFirst({
      select: { id: true, name: true, email: true }
    });

    if (!testUser) {
      console.error('❌ Error: No users found in database to run tests against.');
      process.exit(1);
    }

    console.log(`👤 Using test user: ${testUser.name} <${testUser.email}> (ID: ${testUser.id})`);

    // Clear old emails log if it exists to ensure freshness
    const logFilePath = 'c:/Users/krish/MultiInstitutionPlatform/backend/scratch/mock_emails.log';
    if (fs.existsSync(logFilePath)) {
      try {
        fs.unlinkSync(logFilePath);
        console.log('🧹 Cleared old mock_emails.log');
      } catch (err) {
        // ignore
      }
    }

    // 2. Trigger notification
    const testTitle = 'Test Alert Notification';
    const testMessage = 'This is an automated test verifying the SSE + mock email pipeline.';
    const testType = 'INFO';

    console.log('⚡ Calling createNotification...');
    await createNotification(testUser.id, testTitle, testMessage, testType);

    // Give it a brief moment to write the log file
    await new Promise(resolve => setTimeout(resolve, 500));

    // 3. Verify notification in database
    const dbNotification = await prisma.notification.findFirst({
      where: {
        userId: testUser.id,
        title: testTitle,
        message: testMessage
      },
      orderBy: { createdAt: 'desc' }
    });

    if (dbNotification) {
      console.log(`✅ Success: Notification verified in Database! ID: ${dbNotification.id}`);
    } else {
      console.error('❌ Failure: Notification was not found in the Database.');
    }

    // 4. Verify simulated email in mock_emails.log
    if (fs.existsSync(logFilePath)) {
      const logContent = fs.readFileSync(logFilePath, 'utf8');
      if (logContent.includes(testUser.email) && logContent.includes(testTitle)) {
        console.log('✅ Success: Mock email was successfully simulated and written to log file!');
      } else {
        console.error('❌ Failure: Mock email log exists but content did not match expected user/title.');
      }
    } else {
      console.error('❌ Failure: mock_emails.log file was not created.');
    }

    // Cleanup test notification
    if (dbNotification) {
      await prisma.notification.delete({ where: { id: dbNotification.id } });
      console.log('🧹 Cleaned up test notification from Database.');
    }

  } catch (error) {
    console.error('❌ Test failed with exception:', error);
  } finally {
    await prisma.$disconnect();
    console.log('🏁 Test run complete.');
  }
}

runTest();
