import express from 'express';
import { 
  getEvents, getEventById, createEvent, updateEvent, deleteEvent,
  registerForEvent, cancelRegistration, getEventRegistrations, updateRegistrationStatus
} from '../controllers/eventController.js';
import { protect, adminAndOrganizer } from '../middlewares/authMiddleware.js';
import { validate, createEventSchema } from '../utils/validators.js';

const router = express.Router();

router.get('/', protect, getEvents);
router.get('/:id', protect, getEventById);
router.post('/', protect, adminAndOrganizer, validate(createEventSchema), createEvent);
router.put('/:id', protect, adminAndOrganizer, updateEvent);
router.delete('/:id', protect, adminAndOrganizer, deleteEvent);

// Registration & Attendance
router.post('/:id/register', protect, registerForEvent);
router.post('/:id/cancel-registration', protect, cancelRegistration);
router.get('/:id/registrations', protect, getEventRegistrations);
router.put('/:id/registrations/:regId', protect, adminAndOrganizer, updateRegistrationStatus);

export default router;
