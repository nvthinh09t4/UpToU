import { apiClient } from './apiClient';
import type { ReactionSummary, ReactionType } from '../types/reaction';

export const reactionApi = {
  getByStory: async (storyId: number): Promise<ReactionSummary> => {
    const { data } = await apiClient.get<ReactionSummary>(`/stories/${storyId}/reactions`);
    return data;
  },

  upsert: async (storyId: number, reactionType: ReactionType): Promise<ReactionSummary> => {
    const { data } = await apiClient.post<ReactionSummary>(`/stories/${storyId}/reactions`, {
      reactionType,
    });
    return data;
  },
};
