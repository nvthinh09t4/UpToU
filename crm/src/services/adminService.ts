import { apiClient } from './apiClient'
import type {
  AddStoryDetailPayload,
  AdminRewardItem,
  AdminUser,
  Category,
  CategoryBadge,
  CategoryScoreType,
  CreateStoryPayload,
  DashboardStats,
  PagedResult,
  ReportData,
  Story,
  StoryDetail,
  StoryNode,
  StoryNodeAnswer,
  StoryNodeGraph,
  Tag,
  UpdateStoryPayload,
  UpsertBadgePayload,
  UpsertScoreTypePayload,
  UpsertStoryNodeAnswerPayload,
  UpsertStoryNodePayload,
  UserBan,
} from '@/types'

export const adminService = {
  getDashboard: () =>
    apiClient.get<DashboardStats>('/admin/dashboard'),

  getUsers: (params: { page?: number; pageSize?: number; search?: string; role?: string }) =>
    apiClient.get<PagedResult<AdminUser>>('/admin/users', { params }),

  /** Fetch all users with Supervisor or Senior Supervisor roles for story assignment */
  getSupervisors: () =>
    apiClient.get<PagedResult<AdminUser>>('/admin/users', { params: { pageSize: 100, role: 'Supervisor' } }),

  getUser: (id: string) =>
    apiClient.get<AdminUser>(`/admin/users/${id}`),

  updateUser: (id: string, data: Partial<AdminUser> & { roles: string[] }) =>
    apiClient.put<AdminUser>(`/admin/users/${id}`, data),

  deleteUser: (id: string) =>
    apiClient.delete(`/admin/users/${id}`),

  getRoles: () =>
    apiClient.get<string[]>('/admin/roles'),

  createRole: (roleName: string) =>
    apiClient.post('/admin/roles', { roleName }),

  deleteRole: (name: string) =>
    apiClient.delete(`/admin/roles/${name}`),

  // Categories
  getCategories: () =>
    apiClient.get<Category[]>('/admin/categories'),

  getCategory: (id: number) =>
    apiClient.get<Category>(`/categories/${id}`),

  createCategory: (data: Omit<Category, 'id' | 'scoreWeightHistory' | 'createdOn' | 'modifiedOn' | 'createdBy' | 'modifiedBy' | 'children'>) =>
    apiClient.post<Category>('/admin/categories', data),

  updateCategory: (id: number, data: Omit<Category, 'id' | 'scoreWeightHistory' | 'createdOn' | 'modifiedOn' | 'createdBy' | 'modifiedBy' | 'children'>) =>
    apiClient.put<Category>(`/admin/categories/${id}`, data),

  deleteCategory: (id: number) =>
    apiClient.delete(`/admin/categories/${id}`),

  // Score Types
  getScoreTypes: (categoryId: number) =>
    apiClient.get<CategoryScoreType[]>(`/admin/categories/${categoryId}/score-types`),

  upsertScoreType: (categoryId: number, data: UpsertScoreTypePayload) =>
    apiClient.post<CategoryScoreType>(`/admin/categories/${categoryId}/score-types`, data),

  deleteScoreType: (scoreTypeId: number) =>
    apiClient.delete(`/admin/categories/score-types/${scoreTypeId}`),

  // Badges
  getBadges: (categoryId: number) =>
    apiClient.get<CategoryBadge[]>(`/admin/categories/${categoryId}/badges`),

  upsertBadge: (categoryId: number, data: UpsertBadgePayload) =>
    apiClient.post<CategoryBadge>(`/admin/categories/${categoryId}/badges`, data),

  deleteBadge: (badgeId: number) =>
    apiClient.delete(`/admin/categories/badges/${badgeId}`),

  // Stories
  getStories: (categoryId?: number) =>
    apiClient.get<Story[]>('/admin/stories', { params: categoryId ? { categoryId } : undefined }),

  getStory: (id: number) =>
    apiClient.get<Story>(`/stories/${id}`),

  createStory: (data: CreateStoryPayload) =>
    apiClient.post<Story>('/admin/stories', data),

  updateStory: (id: number, data: UpdateStoryPayload) =>
    apiClient.put<Story>(`/admin/stories/${id}`, data),

  deleteStory: (id: number) =>
    apiClient.delete(`/admin/stories/${id}`),

  // ── Story workflow ────────────────────────────────────────────────────────
  submitStory: (id: number) =>
    apiClient.post<Story>(`/admin/stories/${id}/submit`, {}),

  approveStory: (id: number, publishDate: string | null) =>
    apiClient.post<Story>(`/admin/stories/${id}/approve`, { publishDate }),

  rejectStory: (id: number, reason: string) =>
    apiClient.post<Story>(`/admin/stories/${id}/reject`, { reason }),

  getSubmittedStories: () =>
    apiClient.get<Story[]>('/admin/stories/submitted'),

  getStoryDetails: (storyId: number) =>
    apiClient.get<StoryDetail[]>(`/admin/stories/${storyId}/details`),

  addStoryDetail: (storyId: number, data: AddStoryDetailPayload) =>
    apiClient.post<StoryDetail>(`/admin/stories/${storyId}/details`, { storyId, ...data }),

  // Tags
  getTags: () =>
    apiClient.get<Tag[]>('/tags'),

  createTag: (name: string) =>
    apiClient.post<Tag>('/admin/tags', { name }),

  deleteTag: (id: number) =>
    apiClient.delete(`/admin/tags/${id}`),

  // Reports
  getReports: () =>
    apiClient.get<ReportData>('/admin/reports'),

  // Bans
  getBans: (userId?: string) =>
    apiClient.get<UserBan[]>('/admin/bans', { params: userId ? { userId } : undefined }),

  banUser: (data: { userId: string; banType: string; categoryId?: number; reason: string; durationDays?: number }) =>
    apiClient.post<UserBan>('/admin/bans', data),

  revokeBan: (banId: number) =>
    apiClient.post(`/admin/bans/${banId}/revoke`),

  // Reward Shop
  getAdminRewards: (category?: string) =>
    apiClient.get<AdminRewardItem[]>('/admin/rewards', { params: category ? { category } : undefined }),

  createReward: (data: Omit<AdminRewardItem, 'id' | 'isActive' | 'purchaseCount' | 'createdAt'>) =>
    apiClient.post<AdminRewardItem>('/admin/rewards', data),

  updateReward: (id: number, data: Omit<AdminRewardItem, 'id' | 'purchaseCount' | 'createdAt'>) =>
    apiClient.put<AdminRewardItem>(`/admin/rewards/${id}`, data),

  deleteReward: (id: number) =>
    apiClient.delete(`/admin/rewards/${id}`),

  // Interactive Story Nodes
  getStoryNodeGraph: (detailId: number) =>
    apiClient.get<StoryNodeGraph>(`/admin/story-nodes/${detailId}`),

  upsertStoryNode: (data: UpsertStoryNodePayload) =>
    apiClient.post<StoryNode>('/admin/story-nodes', data),

  deleteStoryNode: (id: number) =>
    apiClient.delete(`/admin/story-nodes/${id}`),

  upsertStoryNodeAnswer: (data: UpsertStoryNodeAnswerPayload) =>
    apiClient.post<StoryNodeAnswer>('/admin/story-node-answers', data),

  deleteStoryNodeAnswer: (id: number) =>
    apiClient.delete(`/admin/story-node-answers/${id}`),
}
