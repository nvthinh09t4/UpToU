export interface DashboardStats {
  totalUsers: number
  registeredToday: number
  loggedInToday: number
  totalRoles: number
  activeUsers: number
}

export interface AdminUser {
  id: string
  email: string
  firstName: string
  lastName: string
  isActive: boolean
  emailConfirmed: boolean
  createdAt: string
  lastLoginAt: string | null
  roles: string[]
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export interface Category {
  id: number
  title: string
  description: string | null
  isActive: boolean
  scoreWeight: number
  scoreWeightHistory: number[]
  orderToShow: number
  parentId: number | null
  createdOn: string
  modifiedOn: string | null
  createdBy: string | null
  modifiedBy: string | null
  children: Category[]
}

export interface Tag {
  id: number
  name: string
}

export interface StoryDetail {
  id: number
  storyId: number
  revision: number
  isPublish: boolean
  content: string | null
  wordCount: number
  changeNotes: string | null
  scoreWeight: number
  scoreWeightHistory: number[]
  savePath: string
  effectiveDate: string | null
  createdOn: string
  createdBy: string | null
}

export interface Story {
  id: number
  title: string
  slug: string | null
  description: string | null
  excerpt: string | null
  coverImageUrl: string | null
  authorName: string | null
  isFeatured: boolean
  publishDate: string | null
  isPublish: boolean
  isDeleted: boolean
  storyType: string
  categoryId: number
  categoryTitle: string
  createdOn: string
  modifiedOn: string | null
  createdBy: string | null
  modifiedBy: string | null
  tags: Tag[]
  latestDetail: StoryDetail | null
}

// ── Reports ──────────────────────────────────────────────────────────────────

export interface SiteOverview {
  totalUsers: number
  newUsersThisWeek: number
  newUsersThisMonth: number
  totalStories: number
  publishedStories: number
  totalViews: number
  totalComments: number
  totalReactions: number
  totalVotes: number
  totalBookmarks: number
}

export interface StoryStats {
  id: number
  title: string
  categoryTitle: string
  coverImageUrl: string | null
  authorName: string | null
  viewCount: number
  commentCount: number
  reactionCount: number
  upvoteCount: number
  downvoteCount: number
  bookmarkCount: number
  publishDate: string | null
}

export interface TrendingStory {
  id: number
  title: string
  categoryTitle: string
  coverImageUrl: string | null
  trendScore: number
  recentComments: number
  recentReactions: number
  recentVotes: number
  recentBookmarks: number
}

export interface UserActivity {
  id: string
  name: string
  email: string
  mentionHandle: string | null
  createdAt: string
  commentCount: number
  reactionCount: number
  voteCount: number
  bookmarkCount: number
  totalActivity: number
}

export interface CategoryStats {
  id: number
  title: string
  storyCount: number
  totalViews: number
  totalComments: number
  totalReactions: number
  totalBookmarks: number
}

export interface ReactionDistribution {
  likeCount: number
  loveCount: number
  laughCount: number
}

export interface ReportData {
  overview: SiteOverview
  topStories: StoryStats[]
  trendingStories: TrendingStory[]
  mostActiveUsers: UserActivity[]
  categoryStats: CategoryStats[]
  reactionDistribution: ReactionDistribution
}

// ── Jobs ─────────────────────────────────────────────────────────────────────

export interface RecurringJobInfo {
  id: string
  displayName: string
  cron: string
  lastExecution: string | null
  nextExecution: string | null
  lastJobState: string | null
}

export interface JobHistoryItem {
  id: string
  jobName: string
  state: 'Succeeded' | 'Failed'
  executedAt: string | null
  duration: string | null
  exceptionMessage: string | null
}

export interface JobStats {
  enqueued: number
  scheduled: number
  processing: number
  succeeded: number
  failed: number
  recurring: number
}

// ── Bans ─────────────────────────────────────────────────────────────────────

export interface UserBan {
  id: number
  userId: string
  userEmail: string
  userName: string
  banType: 'Global' | 'Category'
  categoryId: number | null
  categoryTitle: string | null
  reason: string
  issuedByName: string
  issuedAt: string
  expiresAt: string | null
  revokedAt: string | null
  revokedBy: string | null
  isActive: boolean
}

// ── Reward Shop ───────────────────────────────────────────────────────────────

export interface AdminRewardItem {
  id: number
  name: string
  description: string | null
  category: 'Title' | 'AvatarFrame' | 'Avatar' | 'StoryAccess'
  creditCost: number
  value: string | null
  previewUrl: string | null
  isActive: boolean
  purchaseCount: number
  createdAt: string
}

// ── Interactive Story Nodes ───────────────────────────────────────────────────

export interface StoryNodeAnswer {
  id: number
  text: string
  pointsAwarded: number
  nextNodeId: number | null
  color: string | null
  sortOrder: number
}

export interface StoryNode {
  id: number
  storyDetailId: number
  question: string
  questionSubtitle: string | null
  isStart: boolean
  backgroundImageUrl: string | null
  backgroundColor: string | null
  videoUrl: string | null
  animationType: string | null
  sortOrder: number
  answers: StoryNodeAnswer[]
}

export interface StoryNodeGraph {
  storyDetailId: number
  revision: number
  effectiveDate: string | null
  nodes: StoryNode[]
}

export interface AuthResponse {
  accessToken: string
  accessTokenExpiry: string
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    roles: string[]
  }
}
