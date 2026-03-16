import { apiClient } from './apiClient';

export interface StreakDto {
  currentStreak: number;
  longestStreak: number;
  lastCompletionDate: string | null;
  nextMilestone: number;
  creditsAtNextMilestone: number;
}

export const streakApi = {
  getMyStreak: () =>
    apiClient.get<StreakDto>('/users/me/streak').then(r => r.data),
};
