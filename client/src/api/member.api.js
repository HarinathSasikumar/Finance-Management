import api from './axios';
export const memberAPI = {
  getByGroup: (groupId) => api.get(`/groups/${groupId}/members`),
  add: (groupId, data) => api.post(`/groups/${groupId}/members`, data),
  update: (groupId, memberId, data) => api.put(`/groups/${groupId}/members/${memberId}`, data),
  delete: (groupId, memberId) => api.delete(`/groups/${groupId}/members/${memberId}`),
  getRankings: () => api.get('/members/rankings'),
};
