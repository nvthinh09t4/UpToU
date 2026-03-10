import { apiClient } from './apiClient';
import type { Comment, PostCommentRequest } from '../types/comment';

export const commentApi = {
  getByStory: async (storyId: number, sortBy = 'Newest'): Promise<Comment[]> => {
    const { data } = await apiClient.get<Comment[]>(`/stories/${storyId}/comments`, { params: { sortBy } });
    return data;
  },

  post: async (req: PostCommentRequest): Promise<Comment> => {
    const { data } = await apiClient.post<Comment>(`/stories/${req.storyId}/comments`, {
      body: req.body,
      parentCommentId: req.parentCommentId ?? null,
    });
    return data;
  },

  delete: async (storyId: number, commentId: number): Promise<void> => {
    await apiClient.delete(`/stories/${storyId}/comments/${commentId}`);
  },
};
