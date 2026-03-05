export interface DashboardStats {
  totalUsers: number
  registeredToday: number
  loggedInToday: number
  totalRoles: number
  activeUsers: number
}

export interface AdminUser {
  id: string
  email: string
  firstName: string
  lastName: string
  isActive: boolean
  emailConfirmed: boolean
  createdAt: string
  lastLoginAt: string | null
  roles: string[]
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export interface Category {
  id: number
  title: string
  description: string | null
  isActive: boolean
  scoreWeight: number
  scoreWeightHistory: number[]
  orderToShow: number
  parentId: number | null
  createdOn: string
  modifiedOn: string | null
  createdBy: string | null
  modifiedBy: string | null
  children: Category[]
}

export interface AuthResponse {
  accessToken: string
  accessTokenExpiry: string
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    roles: string[]
  }
}
