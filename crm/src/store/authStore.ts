import { create } from 'zustand'

interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  roles: string[]
}

interface AuthState {
  accessToken: string | null
  user: AuthUser | null
  setAuth: (token: string, user: AuthUser) => void
  setAccessToken: (token: string) => void
  clearAuth: () => void
  isAdmin: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  setAuth: (token, user) => set({ accessToken: token, user }),
  setAccessToken: (token) => set({ accessToken: token }),
  clearAuth: () => set({ accessToken: null, user: null }),
  isAdmin: () => get().user?.roles.includes('Admin') ?? false,
}))
