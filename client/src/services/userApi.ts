import { apiClient } from './apiClient';
import type { UserMention } from '../types/notification';

export const userApi = {
  searchMentions: async (prefix: string): Promise<UserMention[]> => {
    const { data } = await apiClient.get<UserMention[]>('/users/search', {
      params: { q: prefix },
    });
    return data;
  },
};
