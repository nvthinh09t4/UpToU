import { apiClient } from './apiClient';
import type { UserProgress } from '../types/progress';

export const progressApi = {
  getProgress: () => apiClient.get<UserProgress>('/me/progress'),
};
