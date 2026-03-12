export interface CreditBalance {
  balance: number;
  activeTitle: string | null;
  activeAvatarFrameUrl: string | null;
  avatarUrl: string | null;
  totalCreditsEarned: number;
  rankName: string;
  rankStars: number;
}

export interface CreditTransaction {
  id: number;
  amount: number;
  type: string;
  referenceId: number | null;
  description: string | null;
  createdAt: string;
}

export interface RewardItem {
  id: number;
  name: string;
  description: string | null;
  category: 'Title' | 'AvatarFrame' | 'Avatar' | 'StoryAccess' | 'NameChange';
  creditCost: number;
  value: string | null;
  previewUrl: string | null;
  isUnlocked: boolean;
  isActive: boolean;
}

export interface CreditHistory {
  balance: number;
  transactions: CreditTransaction[];
  totalCount: number;
}

export type CreditTransactionType =
  | 'DailyLogin'
  | 'StoryRead'
  | 'CommentPost'
  | 'ReceiveUpvote'
  | 'RewardUnlock';
