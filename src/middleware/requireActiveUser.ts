import type { NextFunction, Request, Response } from "express";

import { prisma } from "../config/prisma.js";
import { AppError } from "../core/errors/AppError.js";

interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    role: string;
    sessionId: string;
  };
}

/*
 * ==================================================
 * REQUIRE ACTIVE USER
 * ==================================================
 *
 * This middleware runs AFTER authenticate().
 *
 * authenticate()
 *      ↓
 * Verifies the access token and session.
 *
 * requireActiveUser()
 *      ↓
 * Checks the user's current database account status.
 *
 * This ensures suspended or deactivated accounts
 * cannot access routes protected by this middleware.
 */

export async function requireActiveUser(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authenticatedRequest = req as AuthenticatedRequest;

    if (!authenticatedRequest.auth) {
      throw new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");
    }

    const user = await prisma.orm.public.User.first({
      id: authenticatedRequest.auth.userId,
    });

    if (!user) {
      throw new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");
    }

    if (user.status !== "ACTIVE") {
      throw new AppError("Account is not active", 403, "ACCOUNT_NOT_ACTIVE");
    }

    next();
  } catch (error) {
    next(error);
  }
}
