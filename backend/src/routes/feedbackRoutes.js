import express from 'express';
import { submitFeedback, getEventFeedback, getGlobalFeedbackStats } from '../controllers/feedbackController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', protect, submitFeedback);
router.get('/event/:eventId', protect, getEventFeedback);
router.get('/stats', protect, getGlobalFeedbackStats);

export default router;
