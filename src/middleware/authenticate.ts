import type { NextFunction, Request, Response } from "express";

import { prisma } from "../config/prisma.js";
import { AppError } from "../core/errors/AppError.js";
import { verifyAccessToken } from "../core/security/jwt.js";

interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    role: string;
    sessionId: string;
  };
}

function authenticationRequired(): AppError {
  return new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      throw authenticationRequired();
    }

    // Accept exactly: Bearer <token>
    const parts = authorization.trim().split(/\s+/);

    if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
      throw authenticationRequired();
    }

    // Verify the signature, allowed algorithm, and token expiration.
    const payload = await verifyAccessToken(parts[1]);

    // Verify that the server-side session exists and is still valid.
    const session = await prisma.orm.public.AuthSession.first({
      id: payload.sessionId,
    });

    if (!session || session.userId !== payload.userId || session.revokedAt !== null || session.expiresAt.epochMilliseconds <= Date.now()) {
      throw authenticationRequired();
    }

    // Always load the current account state and role from the database.
    const user = await prisma.orm.public.User.first({
      id: payload.userId,
    });

    if (!user) {
      throw authenticationRequired();
    }

    // Reject inactive accounts on every route using this middleware.
    if (user.status !== "ACTIVE") {
      throw new AppError("Account is not active", 403, "ACCOUNT_NOT_ACTIVE");
    }

    const authenticatedRequest = req as AuthenticatedRequest;

    authenticatedRequest.auth = {
      userId: user.id,
      role: user.role,
      sessionId: session.id,
    };

    next();
  } catch (error) {
    next(error);
  }
}
