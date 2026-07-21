import api from '../api';

export const institutionService = {
  getAll: () => api.get('/institutions'),
  getById: (id) => api.get(`/institutions/${id}`),
  create: (data) => api.post('/institutions', data),
  update: (id, data) => api.put(`/institutions/${id}`, data),
  delete: (id) => api.delete(`/institutions/${id}`),
};
