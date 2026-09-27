import type { Response } from "express";

import { env, isProduction } from "../../config/env.js";

const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export function setRefreshTokenCookie(
  res: Response,
  refreshToken: string,
): void {
  res.cookie(env.AUTH_REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,

    // HTTPS only in production.
    secure: isProduction,

    // Protect against cross-site request sending.
    sameSite: "lax",

    path: "/api/auth",

    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  });
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(env.AUTH_REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/api/auth",
  });
}
