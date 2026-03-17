import { apiClient } from './apiClient';

export interface StoryRatingDto {
  storyId: number;
  averageRating: number;
  ratingCount: number;
  myRating: number | null;
  myComment: string | null;
}

export interface RecommendedStoryDto {
  id: number;
  title: string;
  slug: string | null;
  excerpt: string | null;
  coverImageUrl: string | null;
  storyType: string;
  categoryId: number;
  categoryTitle: string;
  averageRating: number;
  ratingCount: number;
  viewCount: number;
  reasonCategory: string;
}

export const ratingApi = {
  getStoryRating: (storyId: number) =>
    apiClient.get<StoryRatingDto>(`/stories/${storyId}/rating`).then(r => r.data),

  rateStory: (storyId: number, rating: number, comment?: string) =>
    apiClient.post<StoryRatingDto>(`/stories/${storyId}/rate`, { rating, comment }).then(r => r.data),

  getRecommended: (count = 6) =>
    apiClient.get<RecommendedStoryDto[]>('/stories/recommended', { params: { count } }).then(r => r.data),
};
