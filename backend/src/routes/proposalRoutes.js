import express from 'express';
import { createProposal, getProposals, updateProposalStatus, deleteProposalstatus } from '../controllers/proposalController.js';
import { protect, adminOnly, adminAndOrganizer } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', adminAndOrganizer, createProposal);
router.get('/', adminAndOrganizer, getProposals);
router.put('/:id', updateProposalStatus);
router.delete('/:id', adminOnly, deleteProposalstatus);

export default router;
