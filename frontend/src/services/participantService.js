import api from '../api';

export const participantService = {
  getAll: (params) => api.get('/participants', { params }),
  getById: (id) => api.get(`/participants/${id}`),
  update: (id, data) => api.put(`/participants/${id}`, data),
  delete: (id) => api.delete(`/participants/${id}`),
  getLeaderboard: () => api.get('/participants/leaderboard'),
};
