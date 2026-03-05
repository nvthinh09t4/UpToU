import { apiClient } from './apiClient'
import type { AuthResponse } from '@/types'

export const authService = {
  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>('/auth/login', { email, password }),

  logout: () => apiClient.post('/auth/logout'),

  me: () => apiClient.get<AuthResponse['user']>('/auth/me'),
}
