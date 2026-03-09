export type VoteType = 'Up' | 'Down';

export interface VoteResult {
  upvoteCount: number;
  downvoteCount: number;
  currentUserVote: VoteType | null;
}
