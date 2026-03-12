export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  mentionHandle: string | null;
  activeTitle: string | null;
  activeAvatarFrameUrl: string | null;
  avatarUrl: string | null;
  totalCredits: number;
  activityCount: number;
  rankName: string;
  rankStars: number;
}

export interface Leaderboard {
  boardType: 'Overall' | 'Category' | 'MostActive';
  categoryId: number | null;
  categoryTitle: string | null;
  timePeriod: string;
  entries: LeaderboardEntry[];
}

export interface LeaderboardSummary {
  overall: Leaderboard;
  byCategory: Leaderboard[];
  mostActive: Leaderboard;
}

export type TimePeriod = 'AllTime' | 'Monthly' | 'Weekly';
