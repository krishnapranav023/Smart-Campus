import express from 'express';
import { getAllSponsors, getSponsorsByEvent, addSponsor, deleteSponsor, updateSponsor } from '../controllers/sponsorController.js';
import { protect, adminAndOrganizer } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getAllSponsors);
router.get('/event/:eventId', getSponsorsByEvent);
router.post('/', adminAndOrganizer, addSponsor);
router.put('/:id', adminAndOrganizer, updateSponsor);
router.delete('/:id', adminAndOrganizer, deleteSponsor);

export default router;
