import { apiClient } from './apiClient';
import type { Notification, PagedNotifications } from '../types/notification';

export const notificationApi = {
  getAll: async (page = 1, pageSize = 20): Promise<Notification[]> => {
    const { data } = await apiClient.get<PagedNotifications>('/notifications', {
      params: { page, pageSize },
    });
    return data.items;
  },

  getUnreadCount: async (): Promise<number> => {
    const { data } = await apiClient.get<number>('/notifications/unread-count');
    return data;
  },

  markRead: async (ids: number[]): Promise<void> => {
    await apiClient.post('/notifications/mark-read', { notificationIds: ids });
  },

  getByFolder: async (
    folder: string,
    page = 1,
    pageSize = 20,
  ): Promise<PagedNotifications> => {
    const { data } = await apiClient.get<PagedNotifications>(
      `/notifications/folder/${folder}`,
      { params: { page, pageSize } },
    );
    return data;
  },

  archive: async (ids: number[]): Promise<void> => {
    await apiClient.post('/notifications/archive', { notificationIds: ids });
  },

  toggleImportant: async (id: number): Promise<boolean> => {
    const { data } = await apiClient.post<boolean>(
      `/notifications/${id}/toggle-important`,
    );
    return data;
  },

  cleanupArchived: async (): Promise<number> => {
    const { data } = await apiClient.delete<number>('/notifications/archived');
    return data;
  },
};
