export interface ReactionSummary {
  likeCount: number;
  loveCount: number;
  laughCount: number;
  currentUserReaction: string | null;
}

export type ReactionType = 'Like' | 'Love' | 'Laugh';
