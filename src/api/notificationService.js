import apiClient from './client'

export const notificationService = {
    // Get all notifications for current user
    getAllNotifications: async (params = {}) => {
        const response = await apiClient.get('/notifications', { params })
        return response.data
    },

    // Get unread count
    getUnreadCount: async () => {
        const response = await apiClient.get('/notifications/unread-count')
        return response.data
    },

    // Mark notification as read
    markAsRead: async (notificationId) => {
        const response = await apiClient.put(`/notifications/${notificationId}/read`)
        return response.data
    },

    // Mark all as read
    markAllAsRead: async () => {
        const response = await apiClient.put('/notifications/read-all')
        return response.data
    },

    // Delete notification
    deleteNotification: async (notificationId) => {
        const response = await apiClient.delete(`/notifications/${notificationId}`)
        return response.data
    },

    // Clear all notifications
    clearAllNotifications: async () => {
        const response = await apiClient.delete('/notifications')
        return response.data
    },
}

export default notificationService
