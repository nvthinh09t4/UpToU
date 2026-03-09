import { apiClient } from './apiClient';
import type { Notification } from '../types/notification';

export const notificationApi = {
  getAll: async (page = 1, pageSize = 20): Promise<Notification[]> => {
    const { data } = await apiClient.get<Notification[]>('/notifications', {
      params: { page, pageSize },
    });
    return data;
  },

  getUnreadCount: async (): Promise<number> => {
    const { data } = await apiClient.get<{ count: number }>('/notifications/unread-count');
    return data.count;
  },

  markRead: async (ids: number[]): Promise<void> => {
    await apiClient.post('/notifications/mark-read', { notificationIds: ids });
  },
};
