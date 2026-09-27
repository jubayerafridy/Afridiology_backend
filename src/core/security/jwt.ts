import { SignJWT, jwtVerify, type JWTPayload } from "jose";

import { env } from "../../config/env.js";

export type AccessTokenPayload = {
  userId: number;
  role: string;
  sessionId: number;
};

export type RefreshTokenPayload = {
  userId: number;
  sessionId: number;
};

function getAccessSecret(): Uint8Array {
  return new TextEncoder().encode(env.JWT_ACCESS_SECRET);
}

function getRefreshSecret(): Uint8Array {
  return new TextEncoder().encode(env.JWT_REFRESH_SECRET);
}

/**
 * Create a short-lived access JWT.
 */
export async function createAccessToken(
  payload: AccessTokenPayload,
): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    role: payload.role,
    sessionId: payload.sessionId,
  })
    .setProtectedHeader({
      alg: "HS256",
      typ: "JWT",
    })
    .setIssuedAt()
    .setSubject(String(payload.userId))
    .setExpirationTime(env.JWT_ACCESS_EXPIRES_IN)
    .sign(getAccessSecret());
}

/**
 * Create a long-lived refresh JWT.
 *
 * The refresh token is still backed by an AuthSession in the database.
 * JWT validity alone is NOT enough to authenticate a session.
 */
export async function createRefreshToken(
  payload: RefreshTokenPayload,
): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    sessionId: payload.sessionId,
  })
    .setProtectedHeader({
      alg: "HS256",
      typ: "JWT",
    })
    .setIssuedAt()
    .setSubject(String(payload.userId))
    .setExpirationTime(env.JWT_REFRESH_EXPIRES_IN)
    .sign(getRefreshSecret());
}

/**
 * Verify an access JWT.
 */
export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, getAccessSecret(), {
    algorithms: ["HS256"],
  });

  return parseAccessPayload(payload);
}

/**
 * Verify a refresh JWT.
 */
export async function verifyRefreshToken(
  token: string,
): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, getRefreshSecret(), {
    algorithms: ["HS256"],
  });

  return parseRefreshPayload(payload);
}

function parseAccessPayload(payload: JWTPayload): AccessTokenPayload {
  if (
    typeof payload.userId !== "number" ||
    !Number.isInteger(payload.userId) ||
    payload.userId <= 0
  ) {
    throw new Error("Invalid access token userId");
  }

  if (typeof payload.role !== "string" || payload.role.length === 0) {
    throw new Error("Invalid access token role");
  }

  if (
    typeof payload.sessionId !== "number" ||
    !Number.isInteger(payload.sessionId) ||
    payload.sessionId <= 0
  ) {
    throw new Error("Invalid access token sessionId");
  }

  return {
    userId: payload.userId,
    role: payload.role,
    sessionId: payload.sessionId,
  };
}

function parseRefreshPayload(payload: JWTPayload): RefreshTokenPayload {
  if (
    typeof payload.userId !== "number" ||
    !Number.isInteger(payload.userId) ||
    payload.userId <= 0
  ) {
    throw new Error("Invalid refresh token userId");
  }

  if (
    typeof payload.sessionId !== "number" ||
    !Number.isInteger(payload.sessionId) ||
    payload.sessionId <= 0
  ) {
    throw new Error("Invalid refresh token sessionId");
  }

  return {
    userId: payload.userId,
    sessionId: payload.sessionId,
  };
}
