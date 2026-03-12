import { apiClient } from './apiClient';
import type { Leaderboard, LeaderboardSummary } from '../types/leaderboard';

export const leaderboardApi = {
  getOverall: async (timePeriod = 'AllTime', top = 50): Promise<Leaderboard> => {
    const { data } = await apiClient.get<Leaderboard>('/leaderboard/overall', {
      params: { timePeriod, top },
    });
    return data;
  },

  getByCategory: async (categoryId: number, timePeriod = 'AllTime', top = 50): Promise<Leaderboard> => {
    const { data } = await apiClient.get<Leaderboard>(`/leaderboard/categories/${categoryId}`, {
      params: { timePeriod, top },
    });
    return data;
  },

  getMostActive: async (timePeriod = 'AllTime', top = 50): Promise<Leaderboard> => {
    const { data } = await apiClient.get<Leaderboard>('/leaderboard/most-active', {
      params: { timePeriod, top },
    });
    return data;
  },

  getSummary: async (timePeriod = 'AllTime', top = 10): Promise<LeaderboardSummary> => {
    const { data } = await apiClient.get<LeaderboardSummary>('/leaderboard/summary', {
      params: { timePeriod, top },
    });
    return data;
  },
};
