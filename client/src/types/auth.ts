export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  creditBalance: number;
  activeTitle: string | null;
  activeAvatarFrameUrl: string | null;
  avatarUrl: string | null;
  favoriteQuote: string | null;
  mentionHandle: string | null;
}

export interface UserStatsDto {
  allTimeCredits: number;
  leaderboardPosition: number;
}

export interface AuthResponse {
  accessToken: string;
  accessTokenExpiry: string;
  user: UserDto;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ApiError {
  title: string;
  detail?: string;
  status: number;
}
