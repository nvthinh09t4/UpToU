export interface Notification {
  id: number;
  type: 'Mention' | 'Reply' | 'Ban' | 'Restrict' | 'System';
  storyId: number | null;
  commentId: number | null;
  actorName: string;
  message: string | null;
  isRead: boolean;
  isArchived: boolean;
  isImportant: boolean;
  createdAt: string;
}

export interface UserMention {
  id: string;
  mentionHandle: string;
  displayName: string;
}

export interface PagedNotifications {
  items: Notification[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
