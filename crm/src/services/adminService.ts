import { apiClient } from './apiClient'
import type { AdminUser, Category, DashboardStats, PagedResult } from '@/types'

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
}
