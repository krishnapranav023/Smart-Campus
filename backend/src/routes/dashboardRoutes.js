import express from 'express';
import { getGlobalStats, getInstitutionStats } from '../controllers/dashboardController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public endpoint for Landing/Login page hero counters
router.get('/global', getGlobalStats);

// Protected endpoints
router.get('/institution', protect, getInstitutionStats);

export default router;
