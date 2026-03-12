import { apiClient } from './apiClient';
import type { Story } from '../types/story';

export const bookmarkApi = {
  toggle: async (storyId: number): Promise<boolean> => {
    const { data } = await apiClient.post<boolean>(`/stories/${storyId}/bookmark`);
    return data;
  },

  getAll: async (): Promise<Story[]> => {
    const { data } = await apiClient.get<Story[]>('/bookmarks');
    return data;
  },
};
