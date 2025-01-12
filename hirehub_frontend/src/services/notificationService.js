import api from './api';

export const notificationService = {
    getNotifications: async (page = 1, limit = 20, type = null) => {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', limit);
        if (type) params.append('type', type);
        return api.get(`/notifications/?${params.toString()}`);
    },

    markAsRead: async (notificationIds) => {
        return api.post('/notifications/mark-read/', {
            notification_ids: notificationIds
        });
    },

    markAllAsRead: async () => {
        return api.post('/notifications/mark-all-read/');
    },

    getUnreadCount: async () => {
        return api.get('/notifications/unread-count/');
    }
}; 