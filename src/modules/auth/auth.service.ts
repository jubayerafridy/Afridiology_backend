import { Temporal } from "@js-temporal/polyfill";

import { prisma } from "../../config/prisma.js";
import { AppError } from "../../core/errors/AppError.js";
import { hashPassword, verifyPassword } from "../../core/security/password.js";
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from "../../core/security/jwt.js";
import {
  generateToken,
  hashToken,
  tokensMatch,
} from "../../core/security/token.js";
import { AUTH_CONSTANTS } from "./auth.constants.js";

import type {
  AccessTokenData,
  AuthenticatedUser,
  AuthResult,
  LoginInput,
  RefreshTokenData,
  RegisterInput,
} from "./auth.types.js";

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
 *
 * Temporal is imported from @js-temporal/polyfill because
 * the project TypeScript configuration does not expose
 * Temporal as a global namespace.
 */

function nowInstant(): Temporal.Instant {
  return Temporal.Now.instant();
}

function instantFromMilliseconds(milliseconds: number): Temporal.Instant {
  return Temporal.Instant.fromEpochMilliseconds(milliseconds);
}

function toAuthenticatedUser(user: {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  emailVerified: boolean;
}): AuthenticatedUser {
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
    throw new AppError(
      "This account is suspended.",
      403,
      AUTH_CONSTANTS.ERROR_CODES.ACCOUNT_SUSPENDED,
    );
  }

  if (status === "DEACTIVATED") {
    throw new AppError(
      "This account is deactivated.",
      403,
      AUTH_CONSTANTS.ERROR_CODES.ACCOUNT_DEACTIVATED,
    );
  }

  if (status !== "ACTIVE") {
    throw new AppError(
      "This account is not active.",
      403,
      "ACCOUNT_NOT_ACTIVE",
    );
  }
}

/*
 * ==================================================
 * CREATE SESSION + TOKENS
 * ==================================================
 *
 * Create a new authentication session and issue
 * both access and refresh tokens.
 *
 * The session must exist before the JWTs are created
 * because both token types contain the session ID.
 */

async function createSessionAndTokens(user: {
  id: number;
  role: string;
}): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  return prisma.transaction(async (tx) => {
    /*
     * Create a temporary random value first.
     *
     * AuthSession.tokenHash is required, while the final
     * refresh JWT cannot be generated until we know the
     * newly-created session ID.
     */

    const temporaryToken = generateToken(AUTH_CONSTANTS.REFRESH_TOKEN_BYTES);

    const temporaryTokenHash = hashToken(temporaryToken);

    /*
     * Session lifetime:
     *
     * 30 days for now, matching the current auth design.
     *
     * IMPORTANT:
     * Use Temporal.Instant instead of JavaScript Date
     * because Prisma 8 timestamptz expects Temporal.Instant.
     */

    const expiresAt = instantFromMilliseconds(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    );

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

    /*
     * Store only the hash of the refresh JWT.
     *
     * The raw refresh JWT is returned to the controller
     * and eventually placed in the HttpOnly cookie.
     */

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
 * REGISTER
 * ==================================================
 *
 * Register a new local/password user.
 */

export async function register(input: RegisterInput): Promise<AuthResult> {
  const email = normalizeEmail(input.email);

  /*
   * Check for an existing account before hashing.
   *
   * The database's unique email constraint remains the
   * final protection against concurrent duplicate inserts.
   */

  const existingUser = await prisma.orm.public.User.first({
    email,
  });

  if (existingUser) {
    throw new AppError(
      "An account with this email already exists.",
      409,
      AUTH_CONSTANTS.ERROR_CODES.EMAIL_ALREADY_EXISTS,
    );
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
 * LOGIN
 * ==================================================
 *
 * Authenticate a local/password user.
 */

export async function login(input: LoginInput): Promise<AuthResult> {
  const email = normalizeEmail(input.email);

  const user = await prisma.orm.public.User.first({
    email,
  });

  /*
   * Never reveal whether an email exists.
   *
   * Unknown email and wrong password intentionally
   * return exactly the same public error.
   */

  if (!user) {
    throw new AppError(
      "Invalid email or password.",
      401,
      AUTH_CONSTANTS.ERROR_CODES.INVALID_CREDENTIALS,
    );
  }

  const passwordValid = await verifyPassword(input.password, user.passwordHash);

  if (!passwordValid) {
    throw new AppError(
      "Invalid email or password.",
      401,
      AUTH_CONSTANTS.ERROR_CODES.INVALID_CREDENTIALS,
    );
  }

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
 * REFRESH
 * ==================================================
 *
 * Rotate a refresh token.
 *
 * A refresh JWT is NOT trusted by itself.
 *
 * We verify:
 * 1. JWT signature
 * 2. JWT expiration
 * 3. user ID
 * 4. session ID
 * 5. session existence
 * 6. session expiration
 * 7. session revocation
 * 8. stored refresh-token hash
 *
 * Then the stored hash is replaced with the new
 * refresh-token hash.
 */

export async function refresh(refreshToken: string): Promise<AuthResult> {
  let tokenData: RefreshTokenData;

  try {
    tokenData = await verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(
      "Invalid refresh token.",
      401,
      AUTH_CONSTANTS.ERROR_CODES.INVALID_REFRESH_TOKEN,
    );
  }

  const session = await prisma.orm.public.AuthSession.first({
    id: tokenData.sessionId,
  });

  if (!session) {
    throw new AppError(
      "Invalid refresh token.",
      401,
      AUTH_CONSTANTS.ERROR_CODES.INVALID_REFRESH_TOKEN,
    );
  }

  /*
   * The session must belong to the same user
   * contained in the refresh JWT.
   */

  if (session.userId !== tokenData.userId) {
    throw new AppError(
      "Invalid refresh token.",
      401,
      AUTH_CONSTANTS.ERROR_CODES.INVALID_REFRESH_TOKEN,
    );
  }

  /*
   * A revoked session can never be refreshed.
   */

  if (session.revokedAt !== null) {
    throw new AppError(
      "This session has been revoked.",
      401,
      AUTH_CONSTANTS.ERROR_CODES.SESSION_REVOKED,
    );
  }

  /*
   * Check the server-side session expiration.
   *
   * Prisma 8 returns timestamptz as Temporal.Instant.
   */

  if (session.expiresAt.epochMilliseconds <= Date.now()) {
    throw new AppError(
      "This session has expired.",
      401,
      AUTH_CONSTANTS.ERROR_CODES.SESSION_EXPIRED,
    );
  }

  /*
   * The JWT may be cryptographically valid but must
   * also match the currently stored token hash.
   */

  if (!tokensMatch(refreshToken, session.tokenHash)) {
    throw new AppError(
      "Invalid refresh token.",
      401,
      AUTH_CONSTANTS.ERROR_CODES.INVALID_REFRESH_TOKEN,
    );
  }

  const user = await prisma.orm.public.User.first({
    id: tokenData.userId,
  });

  if (!user) {
    throw new AppError(
      "Invalid refresh token.",
      401,
      AUTH_CONSTANTS.ERROR_CODES.INVALID_REFRESH_TOKEN,
    );
  }

  assertActiveUser(user.status);

  /*
   * Create replacement tokens using the same
   * server-side session.
   */

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
   * IMPORTANT:
   *
   * The old token hash is part of the WHERE condition.
   *
   * If two requests attempt to rotate the same refresh
   * token concurrently, only the request that still sees
   * the old token hash can update the session.
   */

  const updatedCount = await prisma.orm.public.AuthSession.where({
    id: session.id,
    tokenHash: session.tokenHash,
    revokedAt: null,
  }).updateAndCount({
    tokenHash: newRefreshTokenHash,
  });

  /*
   * Prisma 8's updateAndCount() returns the affected
   * row count directly.
   */

  if (updatedCount !== 1) {
    throw new AppError(
      "Invalid refresh token.",
      401,
      AUTH_CONSTANTS.ERROR_CODES.INVALID_REFRESH_TOKEN,
    );
  }

  return {
    user: toAuthenticatedUser(user),
    accessToken,
    refreshToken: newRefreshToken,
  };
}

/*
 * ==================================================
 * LOGOUT
 * ==================================================
 *
 * Revoke the current authentication session.
 */

export async function logout(sessionId: number, userId: number): Promise<void> {
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
 * to the user.
 */

export async function logoutAll(userId: number): Promise<void> {
  await prisma.orm.public.AuthSession.where({
    userId,
    revokedAt: null,
  }).update({
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

export async function getMe(userId: number): Promise<AuthenticatedUser> {
  const user = await prisma.orm.public.User.first({
    id: userId,
  });

  if (!user) {
    throw new AppError("User not found.", 404, "USER_NOT_FOUND");
  }

  assertActiveUser(user.status);

  return toAuthenticatedUser(user);
}
