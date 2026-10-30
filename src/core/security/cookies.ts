import type { Response } from "express";

import { env, isProduction } from "../../config/env.js";

const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Shared security options for refresh-token cookies.
 *
 * Cookies are:
 * - HttpOnly: inaccessible to JavaScript.
 * - Secure: HTTPS only in production.
 * - SameSite=Lax: provides cross-site request protection.
 * - Host-only: no Domain attribute is specified.
 */
const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  path: "/api/auth",
  maxAge: REFRESH_COOKIE_MAX_AGE_MS,
};

/**
 * STUDENT REFRESH COOKIE
 *
 * Used exclusively by student authentication endpoints.
 */

export function setRefreshTokenCookie(res: Response, refreshToken: string): void {
  res.cookie(env.AUTH_REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(env.AUTH_REFRESH_COOKIE_NAME, refreshCookieOptions);
}

/**
 * ADMIN REFRESH COOKIE
 *
 * Used exclusively by admin authentication endpoints.
 *
 * A separate cookie name prevents student and admin
 * refresh tokens from overwriting each other.
 */

export function setAdminRefreshTokenCookie(res: Response, refreshToken: string): void {
  res.cookie(env.AUTH_ADMIN_REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);
}

export function clearAdminRefreshTokenCookie(res: Response): void {
  res.clearCookie(env.AUTH_ADMIN_REFRESH_COOKIE_NAME, refreshCookieOptions);
}
