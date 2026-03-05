import { apiClient } from './apiClient';
import type { Category } from '../types/category';

export const categoryApi = {
  getAll: () => apiClient.get<Category[]>('/categories').then((r) => r.data),
  getById: (id: number) => apiClient.get<Category>(`/categories/${id}`).then((r) => r.data),
};
