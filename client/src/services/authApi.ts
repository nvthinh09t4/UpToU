import { apiClient } from './apiClient';
import type { AuthResponse, LoginRequest, RegisterRequest, UserDto } from '../types/auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

export const authApi = {
  register: (data: RegisterRequest) =>
    apiClient.post<UserDto>('/auth/register', data),

  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/auth/login', data),

  logout: () =>
    apiClient.post('/auth/logout'),

  refresh: () =>
    apiClient.post<AuthResponse>('/auth/refresh'),

  confirmEmail: (userId: string, token: string) =>
    apiClient.post('/auth/confirm-email', { userId, token }),

  resendConfirmation: (email: string) =>
    apiClient.post('/auth/resend-confirmation', { email }),

  me: () =>
    apiClient.get<UserDto>('/auth/me'),

  getExternalLoginUrl: (provider: 'google' | 'facebook', returnUrl: string) =>
    `${BASE_URL}/api/v1/auth/external-login?provider=${provider}&returnUrl=${encodeURIComponent(returnUrl)}`,
};
