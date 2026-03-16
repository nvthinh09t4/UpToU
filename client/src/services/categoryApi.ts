import { apiClient } from './apiClient';
import type { Category, CategoryBadge, CategoryScoreType } from '../types/category';

// ── Public ────────────────────────────────────────────────────────────────────

export const categoryApi = {
  getAll: () => apiClient.get<Category[]>('/categories').then((r) => r.data),
  getById: (id: number) => apiClient.get<Category>(`/categories/${id}`).then((r) => r.data),
  getBadges: (id: number) => apiClient.get<CategoryBadge[]>(`/categories/${id}/badges`).then((r) => r.data),

  // ── Admin ─────────────────────────────────────────────────────────────────

  admin: {
    getAll: () => apiClient.get<Category[]>('/admin/categories').then((r) => r.data),

    create: (data: { title: string; description?: string; isActive: boolean; scoreWeight: number; orderToShow: number; parentId?: number }) =>
      apiClient.post<Category>('/admin/categories', data).then((r) => r.data),

    update: (id: number, data: { title: string; description?: string; isActive: boolean; scoreWeight: number; orderToShow: number; parentId?: number }) =>
      apiClient.put<Category>(`/admin/categories/${id}`, data).then((r) => r.data),

    delete: (id: number) => apiClient.delete(`/admin/categories/${id}`),

    // Score types
    getScoreTypes: (categoryId: number) =>
      apiClient.get<CategoryScoreType[]>(`/admin/categories/${categoryId}/score-types`).then((r) => r.data),

    upsertScoreType: (categoryId: number, data: { id?: number; name: string; label?: string; scoreWeight: number; orderToShow: number }) =>
      apiClient.post<CategoryScoreType>(`/admin/categories/${categoryId}/score-types`, data).then((r) => r.data),

    deleteScoreType: (scoreTypeId: number) => apiClient.delete(`/admin/categories/score-types/${scoreTypeId}`),

    // Badges
    getBadges: (categoryId: number) =>
      apiClient.get<CategoryBadge[]>(`/admin/categories/${categoryId}/badges`).then((r) => r.data),

    upsertBadge: (categoryId: number, data: { id?: number; tier: number; label: string; labelVi?: string; scoreThreshold: number; badgeImageUrl?: string }) =>
      apiClient.post<CategoryBadge>(`/admin/categories/${categoryId}/badges`, data).then((r) => r.data),

    deleteBadge: (badgeId: number) => apiClient.delete(`/admin/categories/badges/${badgeId}`),
  },
};
