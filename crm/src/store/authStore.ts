import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const CRM_ROLES = ['Admin', 'Senior Supervisor', 'Supervisor', 'Contributor'] as const
export type CrmRole = typeof CRM_ROLES[number]

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
  hasRole: (role: string) => boolean
  isAdmin: () => boolean
  isSeniorSupervisor: () => boolean
  isSupervisor: () => boolean
  isContributor: () => boolean
  /** Staff = Supervisor or Senior Supervisor — can approve/reject stories */
  isStaff: () => boolean
  /** True if user holds at least one CRM role */
  hasAnyCrmRole: () => boolean
  /** Highest-privilege label for display in UI */
  primaryRole: () => string
  /** Roles this user may assign to others */
  assignableRoles: () => string[]
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,

      setAuth: (token, user) => set({ accessToken: token, user }),
      setAccessToken: (token) => set({ accessToken: token }),
      clearAuth: () => set({ accessToken: null, user: null }),

      hasRole: (role) => get().user?.roles.includes(role) ?? false,
      isAdmin: () => get().user?.roles.includes('Admin') ?? false,
      isSeniorSupervisor: () => get().user?.roles.includes('Senior Supervisor') ?? false,
      isSupervisor: () => get().user?.roles.includes('Supervisor') ?? false,
      isContributor: () => get().user?.roles.includes('Contributor') ?? false,

      isStaff: () =>
        (get().user?.roles.includes('Supervisor') ?? false) ||
        (get().user?.roles.includes('Senior Supervisor') ?? false),

      hasAnyCrmRole: () =>
        CRM_ROLES.some((r) => get().user?.roles.includes(r)) ?? false,

      primaryRole: () => {
        const roles = get().user?.roles ?? []
        if (roles.includes('Admin')) return 'Admin'
        if (roles.includes('Senior Supervisor')) return 'Sr. Supervisor'
        if (roles.includes('Supervisor')) return 'Supervisor'
        if (roles.includes('Contributor')) return 'Contributor'
        return 'No Role'
      },

      assignableRoles: () => {
        const roles = get().user?.roles ?? []
        if (roles.includes('Admin')) return ['Admin', 'Senior Supervisor', 'Supervisor', 'Contributor']
        if (roles.includes('Senior Supervisor')) return ['Supervisor', 'Contributor']
        return []
      },
    }),
    {
      name: 'crm-auth',
      storage: createJSONStorage(() => sessionStorage),
      // Only persist the data fields, not the functions
      partialize: (state) => ({ accessToken: state.accessToken, user: state.user }),
    }
  )
)
