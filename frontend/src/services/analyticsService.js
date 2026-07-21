import api from '../api';

export const analyticsService = {
  getGrowth:              () => api.get('/analytics/growth'),
  getRelationships:       () => api.get('/analytics/relationships'),
  getMetrics:             () => api.get('/analytics/metrics'),
  getFunds:               () => api.get('/analytics/funds'),
  getEventTypeBreakdown:  () => api.get('/analytics/event-types'),
  getTopInstitutions:     () => api.get('/analytics/top-institutions'),
  getParticipationGrowth: () => api.get('/analytics/participation-growth'),
  getBudgetSummary:       () => api.get('/analytics/budget-summary'),
  getCollaboration:       () => api.get('/analytics/collaboration'),
};
