import type { VoteType } from './vote';

export interface Tag {
  id: number;
  name: string;
}

export interface StoryDetail {
  id: number;
  storyId: number;
  revision: number;
  isPublish: boolean;
  content: string | null;
  wordCount: number;
  changeNotes: string | null;
  scoreWeight: number;
  scoreWeightHistory: number[];
  savePath: string;
  createdOn: string;
  createdBy: string | null;
}

export interface Story {
  id: number;
  title: string;
  slug: string | null;
  description: string | null;
  excerpt: string | null;
  coverImageUrl: string | null;
  authorName: string | null;
  isFeatured: boolean;
  publishDate: string | null;
  isPublish: boolean;
  isDeleted: boolean;
  categoryId: number;
  categoryTitle: string;
  createdOn: string;
  modifiedOn: string | null;
  createdBy: string | null;
  modifiedBy: string | null;
  tags: Tag[];
  latestDetail: StoryDetail | null;
  viewCount: number;
  upvoteCount: number;
  downvoteCount: number;
  currentUserVote: VoteType | null;
  isBookmarked: boolean;
  storyType: string;
}
