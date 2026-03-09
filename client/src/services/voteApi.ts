import { apiClient } from './apiClient';
import type { VoteResult, VoteType } from '../types/vote';

export const voteApi = {
  voteStory: async (storyId: number, voteType: VoteType): Promise<VoteResult> => {
    const { data } = await apiClient.post<VoteResult>(`/stories/${storyId}/vote`, { voteType });
    return data;
  },

  voteComment: async (storyId: number, commentId: number, voteType: VoteType): Promise<VoteResult> => {
    const { data } = await apiClient.post<VoteResult>(
      `/stories/${storyId}/comments/${commentId}/vote`,
      { voteType }
    );
    return data;
  },
};
