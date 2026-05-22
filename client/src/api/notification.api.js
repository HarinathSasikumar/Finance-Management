import api from './axios';
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/all/read'),
  sendReminders: () => api.post('/notifications/send-reminders'),
  delete: (id) => api.delete(`/notifications/${id}`),
};
