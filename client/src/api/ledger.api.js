import api from './axios';
export const ledgerAPI = {
  getByGroup: (groupId) => api.get(`/groups/${groupId}/ledger`),
  addEntry: (groupId, data) => api.post(`/groups/${groupId}/ledger`, data),
};
