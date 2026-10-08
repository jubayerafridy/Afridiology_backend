export type UserRole =
  | "STUDENT"
  | "TEACHER"
  | "AUTHOR"
  | "MODERATOR"
  | "ADMIN"
  | "SUPER_ADMIN";

export type UserStatus = "ACTIVE" | "SUSPENDED" | "DEACTIVATED";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RefreshInput {
  refreshToken: string;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
}

export interface AuthSessionData {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface AccessTokenData {
  userId: string;
  role: UserRole;
  sessionId: string;
}

export interface RefreshTokenData {
  userId: string;
  sessionId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: AuthenticatedUser;
  accessToken: string;
  refreshToken: string;
}
