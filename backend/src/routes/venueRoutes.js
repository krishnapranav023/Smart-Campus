import express from 'express';
import { getVenues, createVenue, updateVenue, deleteVenue } from '../controllers/venueController.js';
import { protect, adminAndOrganizer } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getVenues);
router.post('/', protect, adminAndOrganizer, createVenue);
router.put('/:id', protect, adminAndOrganizer, updateVenue);
router.delete('/:id', protect, adminAndOrganizer, deleteVenue);

export default router;
