export interface Notification {
  id: number;
  type: 'Mention' | 'Reply';
  storyId: number;
  commentId: number;
  actorName: string;
  isRead: boolean;
  createdAt: string;
}

export interface UserMention {
  id: string;
  mentionHandle: string;
  displayName: string;
}
