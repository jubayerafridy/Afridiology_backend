import type { Request, Response } from "express";

import { AppError } from "../../core/errors/AppError.js";
import {
  clearRefreshTokenCookie,
  setRefreshTokenCookie,
} from "../../core/security/cookies.js";
import { asyncHandler } from "../../core/http/asyncHandler.js";

import {
  getMe,
  login,
  logout,
  logoutAll,
  refresh,
  register,
} from "./auth.service.js";

import { loginSchema, registerSchema } from "./auth.validation.js";

import { env } from "../../config/env.js";

/*
 * ==================================================
 * TYPES
 * ==================================================
 */

interface AuthenticatedRequest extends Request {
  auth?: {
    userId: number;
    role: string;
    sessionId: number;
  };
}

/*
 * ==================================================
 * HELPERS
 * ==================================================
 */

function getValidationErrorMessage(issues: Array<{ message: string }>): string {
  return issues[0]?.message ?? "Invalid request data";
}

function getRefreshTokenFromCookie(req: Request): string | null {
  const cookies = req.cookies as Record<string, unknown> | undefined;

  if (!cookies) {
    return null;
  }

  const token = cookies[env.AUTH_REFRESH_COOKIE_NAME];

  if (typeof token !== "string" || token.length === 0) {
    return null;
  }

  return token;
}

/*
 * ==================================================
 * REGISTER
 * ==================================================
 *
 * POST /api/auth/register
 */

export const registerController = asyncHandler(async (req, res) => {
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    throw new AppError(
      getValidationErrorMessage(result.error.issues),
      400,
      "VALIDATION_ERROR",
    );
  }

  const authResult = await register({
    name: result.data.name,
    email: result.data.email,
    password: result.data.password,
  });

  setRefreshTokenCookie(res, authResult.refreshToken);

  res.status(201).json({
    success: true,
    data: {
      user: authResult.user,
      accessToken: authResult.accessToken,
    },
  });
});

/*
 * ==================================================
 * LOGIN
 * ==================================================
 *
 * POST /api/auth/login
 */

export const loginController = asyncHandler(async (req, res) => {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    throw new AppError(
      getValidationErrorMessage(result.error.issues),
      400,
      "VALIDATION_ERROR",
    );
  }

  const authResult = await login({
    email: result.data.email,
    password: result.data.password,
  });

  setRefreshTokenCookie(res, authResult.refreshToken);

  res.status(200).json({
    success: true,
    data: {
      user: authResult.user,
      accessToken: authResult.accessToken,
    },
  });
});

/*
 * ==================================================
 * REFRESH
 * ==================================================
 *
 * POST /api/auth/refresh
 *
 * Refresh token comes from HttpOnly cookie.
 */

export const refreshController = asyncHandler(async (req, res) => {
  const refreshToken = getRefreshTokenFromCookie(req);

  if (!refreshToken) {
    throw new AppError(
      "Refresh token is required",
      401,
      "INVALID_REFRESH_TOKEN",
    );
  }

  const authResult = await refresh(refreshToken);

  setRefreshTokenCookie(res, authResult.refreshToken);

  res.status(200).json({
    success: true,
    data: {
      user: authResult.user,
      accessToken: authResult.accessToken,
    },
  });
});

/*
 * ==================================================
 * LOGOUT
 * ==================================================
 *
 * POST /api/auth/logout
 *
 * Requires authenticate middleware.
 */

export const logoutController = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.auth) {
    throw new AppError(
      "Authentication required",
      401,
      "AUTHENTICATION_REQUIRED",
    );
  }

  await logout(authReq.auth.sessionId, authReq.auth.userId);

  clearRefreshTokenCookie(res);

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

/*
 * ==================================================
 * LOGOUT ALL
 * ==================================================
 *
 * POST /api/auth/logout-all
 *
 * Requires authenticate middleware.
 */

export const logoutAllController = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.auth) {
    throw new AppError(
      "Authentication required",
      401,
      "AUTHENTICATION_REQUIRED",
    );
  }

  await logoutAll(authReq.auth.userId);

  clearRefreshTokenCookie(res);

  res.status(200).json({
    success: true,
    message: "All sessions have been logged out",
  });
});

/*
 * ==================================================
 * ME
 * ==================================================
 *
 * GET /api/auth/me
 *
 * Requires authenticate middleware.
 */

export const meController = asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.auth) {
    throw new AppError(
      "Authentication required",
      401,
      "AUTHENTICATION_REQUIRED",
    );
  }

  const user = await getMe(authReq.auth.userId);

  res.status(200).json({
    success: true,
    data: {
      user,
    },
  });
});
