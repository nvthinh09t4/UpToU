import type { Story, Tag } from '../types/story';
import { apiClient } from './apiClient';

export const storyApi = {
  getByCategory: (categoryId: number, sortBy = 'Newest') =>
    apiClient.get<Story[]>(`/categories/${categoryId}/stories`, { params: { sortBy } }).then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<Story>(`/stories/${id}`).then((r) => r.data),

  getTags: () =>
    apiClient.get<Tag[]>('/tags').then((r) => r.data),
};
