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

export interface Tag {
  id: number
  name: string
}

export interface StoryDetail {
  id: number
  storyId: number
  revision: number
  isPublish: boolean
  content: string | null
  wordCount: number
  changeNotes: string | null
  scoreWeight: number
  scoreWeightHistory: number[]
  savePath: string
  createdOn: string
  createdBy: string | null
}

export interface Story {
  id: number
  title: string
  slug: string | null
  description: string | null
  excerpt: string | null
  coverImageUrl: string | null
  authorName: string | null
  isFeatured: boolean
  publishDate: string | null
  isPublish: boolean
  isDeleted: boolean
  categoryId: number
  categoryTitle: string
  createdOn: string
  modifiedOn: string | null
  createdBy: string | null
  modifiedBy: string | null
  tags: Tag[]
  latestDetail: StoryDetail | null
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
