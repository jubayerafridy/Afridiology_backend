import type { Request } from "express";

import { AppError } from "../../core/errors/AppError.js";

import { clearAdminRefreshTokenCookie, clearRefreshTokenCookie, setAdminRefreshTokenCookie, setRefreshTokenCookie } from "../../core/security/cookies.js";

import { asyncHandler } from "../../core/http/asyncHandler.js";

import { adminLogin, adminRefresh, getMe, login, logout, logoutAll, refresh, register } from "./auth.service.js";

import { loginSchema, registerSchema } from "./auth.validation.js";

import { env } from "../../config/env.js";

/*
 * ==================================================
 * TYPES
 * ==================================================
 */

interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    role: string;
    sessionId: string;
  };
}

/*
 * ==================================================
 * HELPERS
 * ==================================================
 */

function requireAuthenticatedRequest(req: Request): NonNullable<AuthenticatedRequest["auth"]> {
  const auth = (req as AuthenticatedRequest).auth;

  if (!auth) {
    throw new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");
  }

  return auth;
}

function getCookie(req: Request, cookieName: string): string | null {
  const cookies = req.cookies as Record<string, unknown> | undefined;

  if (!cookies) {
    return null;
  }

  const token = cookies[cookieName];

  if (typeof token !== "string" || token.length === 0) {
    return null;
  }

  return token;
}

function getStudentRefreshToken(req: Request): string | null {
  return getCookie(req, env.AUTH_REFRESH_COOKIE_NAME);
}

function getAdminRefreshToken(req: Request): string | null {
  return getCookie(req, env.AUTH_ADMIN_REFRESH_COOKIE_NAME);
}

function requireRefreshToken(token: string | null): string {
  if (!token) {
    throw new AppError("Authentication required", 401, "INVALID_REFRESH_TOKEN");
  }

  return token;
}

/*
 * ==================================================
 * REGISTER
 * ==================================================
 *
 * POST /api/auth/register
 *
 * Public registration creates STUDENT accounts only.
 * The role is assigned by auth.service.ts.
 */

export const registerController = asyncHandler(async (req, res) => {
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    throw new AppError("Invalid request", 400, "VALIDATION_ERROR");
  }

  const authResult = await register({
    name: result.data.name,
    email: result.data.email,
    password: result.data.password,
  });

  setRefreshTokenCookie(res, authResult.refreshToken);

  res.status(201).json({
    data: {
      user: authResult.user,
      accessToken: authResult.accessToken,
    },
  });
});

/*
 * ==================================================
 * STUDENT LOGIN
 * ==================================================
 *
 * POST /api/auth/login
 *
 * STUDENT accounts only.
 */

export const loginController = asyncHandler(async (req, res) => {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    throw new AppError("Invalid request", 400, "VALIDATION_ERROR");
  }

  const authResult = await login({
    email: result.data.email,
    password: result.data.password,
  });

  setRefreshTokenCookie(res, authResult.refreshToken);

  res.status(200).json({
    data: {
      user: authResult.user,
      accessToken: authResult.accessToken,
    },
  });
});

/*
 * ==================================================
 * ADMIN LOGIN
 * ==================================================
 *
 * POST /api/auth/admin/login
 *
 * ADMIN and SUPER_ADMIN accounts only.
 */

export const adminLoginController = asyncHandler(async (req, res) => {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    throw new AppError("Invalid request", 400, "VALIDATION_ERROR");
  }

  const authResult = await adminLogin({
    email: result.data.email,
    password: result.data.password,
  });

  setAdminRefreshTokenCookie(res, authResult.refreshToken);

  res.status(200).json({
    data: {
      user: authResult.user,
      accessToken: authResult.accessToken,
    },
  });
});

/*
 * ==================================================
 * STUDENT REFRESH
 * ==================================================
 *
 * POST /api/auth/refresh
 *
 * Reads only the student refresh cookie.
 */

export const refreshController = asyncHandler(async (req, res) => {
  const refreshToken = requireRefreshToken(getStudentRefreshToken(req));

  const authResult = await refresh(refreshToken);

  setRefreshTokenCookie(res, authResult.refreshToken);

  res.status(200).json({
    data: {
      user: authResult.user,
      accessToken: authResult.accessToken,
    },
  });
});

/*
 * ==================================================
 * ADMIN REFRESH
 * ==================================================
 *
 * POST /api/auth/admin/refresh
 *
 * Reads only the admin refresh cookie.
 */

export const adminRefreshController = asyncHandler(async (req, res) => {
  const refreshToken = requireRefreshToken(getAdminRefreshToken(req));

  const authResult = await adminRefresh(refreshToken);

  setAdminRefreshTokenCookie(res, authResult.refreshToken);

  res.status(200).json({
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
 *
 * Clears the cookie corresponding to the authenticated
 * account role.
 */

export const logoutController = asyncHandler(async (req, res) => {
  const auth = requireAuthenticatedRequest(req);

  await logout(auth.sessionId, auth.userId);

  if (auth.role === "ADMIN" || auth.role === "SUPER_ADMIN") {
    clearAdminRefreshTokenCookie(res);
  } else {
    clearRefreshTokenCookie(res);
  }

  res.status(200).json({
    data: "Logged out successfully",
  });
});

/*
 * ==================================================
 * LOGOUT ALL
 * ==================================================
 *
 * POST /api/auth/logout-all
 *
 * Revokes every session belonging to the user.
 */

export const logoutAllController = asyncHandler(async (req, res) => {
  const auth = requireAuthenticatedRequest(req);

  await logoutAll(auth.userId);

  // Clear both cookie names because all sessions
  // belonging to this account have been revoked.
  clearRefreshTokenCookie(res);
  clearAdminRefreshTokenCookie(res);

  res.status(200).json({
    data: "All sessions have been logged out",
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
  const auth = requireAuthenticatedRequest(req);

  const user = await getMe(auth.userId);

  res.status(200).json({
    data: {
      user,
    },
  });
});
