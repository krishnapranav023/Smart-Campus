import express from 'express';
import { 
  getOrganizers, getCoordinatedEvents, getOrganizerDashboardStats, getCoordinatedFeedback, sendEventAnnouncement 
} from '../controllers/organizerController.js';
import { getEventVolunteers, updateVolunteerStatus } from '../controllers/volunteerController.js';
import { protect, adminAndOrganizer } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getOrganizers);
router.get('/my-events', adminAndOrganizer, getCoordinatedEvents);
router.get('/dashboard-stats', adminAndOrganizer, getOrganizerDashboardStats);
router.get('/feedback', adminAndOrganizer, getCoordinatedFeedback);
router.get('/volunteers', adminAndOrganizer, getEventVolunteers);
router.put('/volunteers/:id', adminAndOrganizer, updateVolunteerStatus);
router.post('/announce', adminAndOrganizer, sendEventAnnouncement);

export default router;
