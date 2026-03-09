import type { VoteType } from './vote';

export interface CommentAuthor {
  id: string;
  name: string;
  mentionHandle: string | null;
}

export interface Comment {
  id: number;
  storyId: number;
  author: CommentAuthor;
  body: string;
  parentCommentId: number | null;
  createdAt: string;
  editedAt: string | null;
  replies: Comment[];
  upvoteCount: number;
  downvoteCount: number;
  currentUserVote: VoteType | null;
}

export interface PostCommentRequest {
  storyId: number;
  body: string;
  parentCommentId?: number;
}
