import type { Response } from "express";

import { env, isProduction } from "../../config/env.js";

const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/*
 * ==================================================
 * REFRESH COOKIE OPTIONS
 * ==================================================
 *
 * SameSite=None allows cross-site frontend/API requests.
 * Secure=true is required when SameSite=None is used.
 *
 * No Domain attribute: cookies remain host-only.
 */

const refreshCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none" as const,
  path: "/api/auth",
  maxAge: REFRESH_COOKIE_MAX_AGE_MS,
};

/*
 * ==================================================
 * STUDENT REFRESH COOKIE
 * ==================================================
 */

export function setRefreshTokenCookie(res: Response, refreshToken: string): void {
  res.cookie(env.AUTH_REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(env.AUTH_REFRESH_COOKIE_NAME, refreshCookieOptions);
}

/*
 * ==================================================
 * ADMIN REFRESH COOKIE
 * ==================================================
 */

export function setAdminRefreshTokenCookie(res: Response, refreshToken: string): void {
  res.cookie(env.AUTH_ADMIN_REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);
}

export function clearAdminRefreshTokenCookie(res: Response): void {
  res.clearCookie(env.AUTH_ADMIN_REFRESH_COOKIE_NAME, refreshCookieOptions);
}
