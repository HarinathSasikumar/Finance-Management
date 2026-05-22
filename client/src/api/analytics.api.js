import api from './axios';
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getGroupTarget: (id) => api.get(`/analytics/groups/${id}/target`),
  getPredictions: (id) => api.get(`/analytics/groups/${id}/predictions`),
  getGroupRankings: () => api.get('/analytics/rankings'),
};
