import { apiClient } from './apiClient';
import type { CreditBalance, CreditHistory, CreditTransaction, RewardItem } from '../types/credit';

export const creditApi = {
  getBalance: async (): Promise<CreditBalance> => {
    const { data } = await apiClient.get<CreditBalance>('/credits/balance');
    return data;
  },

  getHistory: async (page = 1, pageSize = 20): Promise<CreditHistory> => {
    const { data } = await apiClient.get<CreditHistory>('/credits/history', { params: { page, pageSize } });
    return data;
  },

  getRewards: async (category?: string): Promise<RewardItem[]> => {
    const { data } = await apiClient.get<RewardItem[]>('/credits/rewards', {
      params: category ? { category } : {},
    });
    return data;
  },

  unlockReward: async (rewardId: number): Promise<CreditBalance> => {
    const { data } = await apiClient.post<CreditBalance>(`/credits/rewards/${rewardId}/unlock`);
    return data;
  },

  activateReward: async (rewardId: number, activate = true): Promise<CreditBalance> => {
    const { data } = await apiClient.post<CreditBalance>(
      `/credits/rewards/${rewardId}/activate`,
      null,
      { params: { activate } },
    );
    return data;
  },

  claimDailyLogin: async (): Promise<CreditTransaction> => {
    const { data } = await apiClient.post<CreditTransaction>('/credits/claim/daily-login');
    return data;
  },

  claimStoryRead: async (storyId: number): Promise<CreditTransaction> => {
    const { data } = await apiClient.post<CreditTransaction>(`/credits/claim/story-read/${storyId}`);
    return data;
  },
};
