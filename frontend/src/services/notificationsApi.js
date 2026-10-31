import { apiRequest } from './api.js';

// Client for /api/notifications. Matches src/routes/notifications.routes.js.

const data = (promise) => promise.then((result) => result?.data);

export const listNotifications = (limit = 30) => data(apiRequest(`/notifications?limit=${limit}`));
export const getUnreadCount = () => data(apiRequest('/notifications/unread-count'));
export const markNotificationRead = (id) => data(apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }));
export const markAllNotificationsRead = () => data(apiRequest('/notifications/read-all', { method: 'PATCH' }));