import { apiClient } from './apiClient';
import type { InteractiveStoryState } from '../types/storyNode';

export const interactiveStoryApi = {
  startOrResume: (storyId: number): Promise<InteractiveStoryState> =>
    apiClient.post<InteractiveStoryState>(`/interactive-stories/${storyId}/play`).then((r) => r.data),

  submitAnswer: (progressId: number, answerId: number): Promise<InteractiveStoryState> =>
    apiClient
      .post<InteractiveStoryState>(`/interactive-stories/progress/${progressId}/answer`, { answerId })
      .then((r) => r.data),
};
