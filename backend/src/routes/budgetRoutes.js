import express from 'express';
import { getBudgets, addBudget, updateBudget } from '../controllers/budgetController.js';
import { protect, adminAndOrganizer, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, adminAndOrganizer, getBudgets);
router.post('/', protect, adminOnly, addBudget);
router.put('/:id', protect, adminOnly, updateBudget);

export default router;
