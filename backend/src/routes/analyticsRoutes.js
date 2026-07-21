import express from 'express';
import { 
  getTenYearGrowth, getRelationships, getEventSuccessMetrics, 
  getFundFlow, getEventTypeBreakdown, getTopInstitutions, getParticipationGrowth,
  getBudgetSummary, getCollaborationData
} from '../controllers/analyticsController.js';
import { protect, adminAndOrganizer } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(adminAndOrganizer);

router.get('/growth', getTenYearGrowth);
router.get('/relationships', getRelationships);
router.get('/metrics', getEventSuccessMetrics);
router.get('/funds', getFundFlow);
router.get('/event-types', getEventTypeBreakdown);
router.get('/top-institutions', getTopInstitutions);
router.get('/participation-growth', getParticipationGrowth);
router.get('/budget-summary', getBudgetSummary);
router.get('/collaboration', getCollaborationData);

export default router;

