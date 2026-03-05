import { create } from 'zustand';
import type { UserDto } from '../types/auth';

interface AuthState {
  accessToken: string | null;
  user: UserDto | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: UserDto) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,

  setAuth: (token, user) =>
    set({ accessToken: token, user, isAuthenticated: true }),

  clearAuth: () =>
    set({ accessToken: null, user: null, isAuthenticated: false }),
}));
