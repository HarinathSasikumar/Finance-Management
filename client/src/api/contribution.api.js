import api from './axios';
export const contributionAPI = {
  getByGroup: (groupId, params) => api.get(`/groups/${groupId}/contributions`, { params }),
  getSummary: (groupId) => api.get(`/groups/${groupId}/contributions/summary`),
  mark: (data) => api.post('/contributions', data),
  update: (id, data) => api.put(`/contributions/${id}`, data),
};
