import { Temporal } from "@js-temporal/polyfill";

import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";

import { AppError } from "../../core/errors/AppError.js";

import { hashPassword, verifyPassword } from "../../core/security/password.js";

import { createAccessToken, createRefreshToken, verifyRefreshToken } from "../../core/security/jwt.js";

import { generateToken, hashToken, tokensMatch } from "../../core/security/token.js";

import { AUTH_CONSTANTS } from "./auth.constants.js";

import type { AccessTokenData, AuthenticatedUser, AuthResult, LoginInput, RefreshTokenData, RegisterInput } from "./auth.types.js";

/*
 * ==================================================
 * TYPES
 * ==================================================
 */

type AccountRole = "STUDENT" | "TEACHER" | "AUTHOR" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN";

const STUDENT_ROLES: readonly AccountRole[] = ["STUDENT"];

const ADMIN_ROLES: readonly AccountRole[] = ["ADMIN", "SUPER_ADMIN"];

/*
 * ==================================================
 * HELPERS
 * ==================================================
 */

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/*
 * Prisma 8 PostgreSQL timestamptz uses Temporal.Instant.
 */

function nowInstant(): Temporal.Instant {
  return Temporal.Now.instant();
}

function instantFromMilliseconds(milliseconds: number): Temporal.Instant {
  return Temporal.Instant.fromEpochMilliseconds(milliseconds);
}

function toAuthenticatedUser(user: { id: string; name: string; email: string; role: string; status: string; emailVerified: boolean }): AuthenticatedUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as AuthenticatedUser["role"],
    status: user.status as AuthenticatedUser["status"],
    emailVerified: user.emailVerified,
  };
}

function assertActiveUser(status: string): void {
  if (status === "SUSPENDED") {
    throw new AppError("This account is suspended.", 403, AUTH_CONSTANTS.ERROR_CODES.ACCOUNT_SUSPENDED);
  }

  if (status === "DEACTIVATED") {
    throw new AppError("This account is deactivated.", 403, AUTH_CONSTANTS.ERROR_CODES.ACCOUNT_DEACTIVATED);
  }

  if (status !== "ACTIVE") {
    throw new AppError("This account is not active.", 403, "ACCOUNT_NOT_ACTIVE");
  }
}

function assertAllowedRole(role: string, allowedRoles: readonly AccountRole[]): void {
  if (!allowedRoles.includes(role as AccountRole)) {
    throw new AppError("Invalid email or password.", 401, AUTH_CONSTANTS.ERROR_CODES.INVALID_CREDENTIALS);
  }
}

function invalidRefreshToken(): AppError {
  return new AppError("Invalid refresh token.", 401, AUTH_CONSTANTS.ERROR_CODES.INVALID_REFRESH_TOKEN);
}

/*
 * ==================================================
 * CREATE SESSION + TOKENS
 * ==================================================
 *
 * Create a new authentication session and issue
 * both access and refresh tokens.
 */

async function createSessionAndTokens(user: { id: string; role: string }): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  return prisma.transaction(async (tx) => {
    const temporaryToken = generateToken(AUTH_CONSTANTS.REFRESH_TOKEN_BYTES);

    const temporaryTokenHash = hashToken(temporaryToken);

    const expiresAt = instantFromMilliseconds(Date.now() + env.JWT_REFRESH_EXPIRES_IN_MS);

    const session = await tx.orm.public.AuthSession.create({
      userId: user.id,
      tokenHash: temporaryTokenHash,
      expiresAt,
    });

    const accessTokenData: AccessTokenData = {
      userId: user.id,
      role: user.role as AccessTokenData["role"],
      sessionId: session.id,
    };

    const refreshTokenData: RefreshTokenData = {
      userId: user.id,
      sessionId: session.id,
    };

    const accessToken = await createAccessToken(accessTokenData);

    const refreshToken = await createRefreshToken(refreshTokenData);

    const refreshTokenHash = hashToken(refreshToken);

    await tx.orm.public.AuthSession.where({
      id: session.id,
    }).update({
      tokenHash: refreshTokenHash,
    });

    return {
      accessToken,
      refreshToken,
    };
  });
}

/*
 * ==================================================
 * INVALID CREDENTIALS
 * ==================================================
 *
 * Keep unknown email, incorrect password and
 * incorrect portal role indistinguishable.
 */

function throwInvalidCredentials(): never {
  throw new AppError("Invalid email or password.", 401, AUTH_CONSTANTS.ERROR_CODES.INVALID_CREDENTIALS);
}

/*
 * ==================================================
 * REGISTER
 * ==================================================
 *
 * Public registration always creates STUDENT accounts.
 * The client can never choose its account role.
 */

export async function register(input: RegisterInput): Promise<AuthResult> {
  const email = normalizeEmail(input.email);

  const existingUser = await prisma.orm.public.User.first({
    email,
  });

  if (existingUser) {
    throw new AppError("An account with this email already exists.", 409, AUTH_CONSTANTS.ERROR_CODES.EMAIL_ALREADY_EXISTS);
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.transaction(async (tx) => {
    return tx.orm.public.User.create({
      name: input.name.trim(),
      email,
      passwordHash,
      role: "STUDENT",
      status: "ACTIVE",
      emailVerified: false,
    });
  });

  const tokens = await createSessionAndTokens(user);

  return {
    user: toAuthenticatedUser(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

/*
 * ==================================================
 * SHARED LOGIN IMPLEMENTATION
 * ==================================================
 *
 * Password authentication is shared, but each portal
 * has its own allowed account roles.
 */

async function loginWithRoles(input: LoginInput, allowedRoles: readonly AccountRole[]): Promise<AuthResult> {
  const email = normalizeEmail(input.email);

  const user = await prisma.orm.public.User.first({
    email,
  });

  if (!user) {
    throwInvalidCredentials();
  }

  const passwordValid = await verifyPassword(input.password, user.passwordHash);

  if (!passwordValid) {
    throwInvalidCredentials();
  }

  // Prevent an account from authenticating through
  // the wrong portal, even with a correct password.
  assertAllowedRole(user.role, allowedRoles);

  assertActiveUser(user.status);

  const tokens = await createSessionAndTokens(user);

  return {
    user: toAuthenticatedUser(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

/*
 * ==================================================
 * STUDENT LOGIN
 * ==================================================
 *
 * POST /api/auth/login
 *
 * STUDENT accounts only.
 */

export async function login(input: LoginInput): Promise<AuthResult> {
  return loginWithRoles(input, STUDENT_ROLES);
}

/*
 * ==================================================
 * ADMIN LOGIN
 * ==================================================
 *
 * POST /api/auth/admin/login
 *
 * ADMIN and SUPER_ADMIN accounts only.
 */

export async function adminLogin(input: LoginInput): Promise<AuthResult> {
  return loginWithRoles(input, ADMIN_ROLES);
}

/*
 * ==================================================
 * SHARED REFRESH IMPLEMENTATION
 * ==================================================
 *
 * Refresh tokens are checked against:
 *
 * 1. JWT signature
 * 2. JWT expiration
 * 3. User ID
 * 4. Session ID
 * 5. Session existence
 * 6. Session expiration
 * 7. Session revocation
 * 8. Stored refresh-token hash
 * 9. Current account role
 *
 * Only the original stored token hash can be rotated.
 */

async function refreshWithRoles(refreshToken: string, allowedRoles: readonly AccountRole[]): Promise<AuthResult> {
  let tokenData: RefreshTokenData;

  try {
    tokenData = await verifyRefreshToken(refreshToken);
  } catch {
    throw invalidRefreshToken();
  }

  const session = await prisma.orm.public.AuthSession.first({
    id: tokenData.sessionId,
  });

  if (!session) {
    throw invalidRefreshToken();
  }

  if (session.userId !== tokenData.userId) {
    throw invalidRefreshToken();
  }

  if (session.revokedAt !== null) {
    throw new AppError("This session has been revoked.", 401, AUTH_CONSTANTS.ERROR_CODES.SESSION_REVOKED);
  }

  if (session.expiresAt.epochMilliseconds <= Date.now()) {
    throw new AppError("This session has expired.", 401, AUTH_CONSTANTS.ERROR_CODES.SESSION_EXPIRED);
  }

  if (!tokensMatch(refreshToken, session.tokenHash)) {
    throw invalidRefreshToken();
  }

  const user = await prisma.orm.public.User.first({
    id: tokenData.userId,
  });

  if (!user) {
    throw invalidRefreshToken();
  }

  // This check is essential. A valid refresh token
  // must never cross between student and admin portals.
  if (!allowedRoles.includes(user.role as AccountRole)) {
    throw invalidRefreshToken();
  }

  assertActiveUser(user.status);

  const accessToken = await createAccessToken({
    userId: user.id,
    role: user.role as AccessTokenData["role"],
    sessionId: session.id,
  });

  const newRefreshToken = await createRefreshToken({
    userId: user.id,
    sessionId: session.id,
  });

  const newRefreshTokenHash = hashToken(newRefreshToken);

  /*
   * Atomic refresh-token rotation.
   *
   * The old hash is included in the update condition.
   * Concurrent refresh requests cannot both rotate
   * the same token successfully.
   */

  const updatedCount = await prisma.orm.public.AuthSession.where({
    id: session.id,
    tokenHash: session.tokenHash,
    revokedAt: null,
  }).updateAndCount({
    tokenHash: newRefreshTokenHash,
  });

  if (updatedCount !== 1) {
    throw invalidRefreshToken();
  }

  return {
    user: toAuthenticatedUser(user),
    accessToken,
    refreshToken: newRefreshToken,
  };
}

/*
 * ==================================================
 * STUDENT REFRESH
 * ==================================================
 *
 * POST /api/auth/refresh
 *
 * STUDENT sessions only.
 */

export async function refresh(refreshToken: string): Promise<AuthResult> {
  return refreshWithRoles(refreshToken, STUDENT_ROLES);
}

/*
 * ==================================================
 * ADMIN REFRESH
 * ==================================================
 *
 * POST /api/auth/admin/refresh
 *
 * ADMIN and SUPER_ADMIN sessions only.
 */

export async function adminRefresh(refreshToken: string): Promise<AuthResult> {
  return refreshWithRoles(refreshToken, ADMIN_ROLES);
}

/*
 * ==================================================
 * LOGOUT
 * ==================================================
 *
 * Revoke the current authentication session.
 */

export async function logout(sessionId: string, userId: string): Promise<void> {
  await prisma.orm.public.AuthSession.where({
    id: sessionId,
    userId,
    revokedAt: null,
  }).update({
    revokedAt: nowInstant(),
  });
}

/*
 * ==================================================
 * LOGOUT ALL
 * ==================================================
 *
 * Revoke every authentication session belonging
 * to the user, including sessions on other devices
 * and both authentication portals.
 */

export async function logoutAll(userId: string): Promise<void> {
  await prisma.orm.public.AuthSession.where({
    userId,
    revokedAt: null,
  }).updateAndCount({
    revokedAt: nowInstant(),
  });
}

/*
 * ==================================================
 * GET ME
 * ==================================================
 *
 * Return the currently authenticated user.
 */

export async function getMe(userId: string): Promise<AuthenticatedUser> {
  const user = await prisma.orm.public.User.first({
    id: userId,
  });

  if (!user) {
    throw new AppError("User not found.", 404, "USER_NOT_FOUND");
  }

  assertActiveUser(user.status);

  return toAuthenticatedUser(user);
}
