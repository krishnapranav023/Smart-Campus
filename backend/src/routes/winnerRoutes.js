import express from 'express';
import { getWinners, addWinner, bulkAddWinners, updateWinner, deleteWinner } from '../controllers/winnerController.js';
import { protect, adminAndOrganizer } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getWinners);
router.post('/', adminAndOrganizer, addWinner);
router.post('/bulk', adminAndOrganizer, bulkAddWinners);
router.put('/:id', adminAndOrganizer, updateWinner);
router.delete('/:id', adminAndOrganizer, deleteWinner);

export default router;
