import type { NextFunction, Request, Response } from "express";

import { prisma } from "../config/prisma.js";
import { AppError } from "../core/errors/AppError.js";

interface AuthenticatedRequest extends Request {
  auth?: {
    userId: number;
    role: string;
    sessionId: number;
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
 * verifies access token + session
 *
 * requireActiveUser()
 *      ↓
 * verifies the actual user's current account status
 *
 * This means changing a user's status in the database
 * immediately affects protected requests.
 */

export async function requireActiveUser(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authenticatedRequest = req as AuthenticatedRequest;

    if (!authenticatedRequest.auth) {
      throw new AppError(
        "Authentication required",
        401,
        "AUTHENTICATION_REQUIRED",
      );
    }

    const user = await prisma.orm.public.User.first({
      id: authenticatedRequest.auth.userId,
    });

    if (!user) {
      throw new AppError(
        "Authentication required",
        401,
        "AUTHENTICATION_REQUIRED",
      );
    }

    if (user.status === "SUSPENDED") {
      throw new AppError("Account is suspended", 403, "ACCOUNT_SUSPENDED");
    }

    if (user.status === "DEACTIVATED") {
      throw new AppError("Account is deactivated", 403, "ACCOUNT_DEACTIVATED");
    }

    if (user.status !== "ACTIVE") {
      throw new AppError("Account is not active", 403, "ACCOUNT_NOT_ACTIVE");
    }

    next();
  } catch (error) {
    next(error);
  }
}
