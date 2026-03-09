import { apiClient } from './apiClient'
import type { AdminUser, Category, DashboardStats, PagedResult, Story, StoryDetail, Tag } from '@/types'

export const adminService = {
  getDashboard: () =>
    apiClient.get<DashboardStats>('/admin/dashboard'),

  getUsers: (params: { page?: number; pageSize?: number; search?: string; role?: string }) =>
    apiClient.get<PagedResult<AdminUser>>('/admin/users', { params }),

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

  // Stories
  getStories: (categoryId?: number) =>
    apiClient.get<Story[]>('/admin/stories', { params: categoryId ? { categoryId } : undefined }),

  getStory: (id: number) =>
    apiClient.get<Story>(`/stories/${id}`),

  createStory: (data: {
    title: string; slug: string | null; description: string | null; excerpt: string | null
    coverImageUrl: string | null; authorName: string | null; isFeatured: boolean
    categoryId: number; publishDate: string | null; isPublish: boolean; tagIds: number[]
    savePath: string; content: string | null; wordCount: number; scoreWeight: number
  }) => apiClient.post<Story>('/admin/stories', data),

  updateStory: (id: number, data: {
    title: string; slug: string | null; description: string | null; excerpt: string | null
    coverImageUrl: string | null; authorName: string | null; isFeatured: boolean
    categoryId: number; publishDate: string | null; isPublish: boolean; tagIds: number[]
  }) => apiClient.put<Story>(`/admin/stories/${id}`, data),

  deleteStory: (id: number) =>
    apiClient.delete(`/admin/stories/${id}`),

  getStoryDetails: (storyId: number) =>
    apiClient.get<StoryDetail[]>(`/admin/stories/${storyId}/details`),

  addStoryDetail: (storyId: number, data: {
    savePath: string; content: string | null; wordCount: number
    changeNotes: string | null; scoreWeight: number; isPublish: boolean
  }) => apiClient.post<StoryDetail>(`/admin/stories/${storyId}/details`, { storyId, ...data }),

  // Tags
  getTags: () =>
    apiClient.get<Tag[]>('/tags'),

  createTag: (name: string) =>
    apiClient.post<Tag>('/admin/tags', { name }),

  deleteTag: (id: number) =>
    apiClient.delete(`/admin/tags/${id}`),
}
