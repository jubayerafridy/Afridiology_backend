import type { NextFunction, Request, Response } from "express";

import { prisma } from "../config/prisma.js";
import { AppError } from "../core/errors/AppError.js";
import { verifyAccessToken } from "../core/security/jwt.js";

interface AuthenticatedRequest extends Request {
  auth?: {
    userId: number;
    role: string;
    sessionId: number;
  };
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      throw new AppError(
        "Authentication required",
        401,
        "AUTHENTICATION_REQUIRED",
      );
    }

    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token || token.trim().length === 0) {
      throw new AppError(
        "Authentication required",
        401,
        "AUTHENTICATION_REQUIRED",
      );
    }

    const accessToken = token.trim();

    const payload = await verifyAccessToken(accessToken);

    const session = await prisma.orm.public.AuthSession.first({
      id: payload.sessionId,
    });

    if (!session) {
      throw new AppError(
        "Authentication required",
        401,
        "AUTHENTICATION_REQUIRED",
      );
    }

    if (session.userId !== payload.userId) {
      throw new AppError(
        "Authentication required",
        401,
        "AUTHENTICATION_REQUIRED",
      );
    }

    if (session.revokedAt !== null) {
      throw new AppError(
        "Authentication required",
        401,
        "AUTHENTICATION_REQUIRED",
      );
    }

    /*
     * Prisma 8 PostgreSQL timestamptz is returned as
     * Temporal.Instant.
     *
     * Therefore we must use epochMilliseconds rather
     * than Date.getTime().
     */
    if (session.expiresAt.epochMilliseconds <= Date.now()) {
      throw new AppError(
        "Authentication required",
        401,
        "AUTHENTICATION_REQUIRED",
      );
    }

    const authenticatedRequest = req as AuthenticatedRequest;

    authenticatedRequest.auth = {
      userId: payload.userId,
      role: payload.role,
      sessionId: payload.sessionId,
    };

    next();
  } catch (error) {
    next(error);
  }
}
