import type { NextFunction, Request, Response } from "express";

import { prisma } from "../config/prisma.js";
import { verifyAccessToken } from "../core/security/jwt.js";

interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    role: string;
    sessionId: string;
  };
}

/**
 * Optional authentication middleware.
 *
 * Behavior:
 *
 * 1. No Authorization header
 *    → continue as anonymous
 *
 * 2. Valid Bearer access token
 *    → validate the JWT and server-side session
 *    → attach req.auth
 *    → continue
 *
 * 3. Invalid / expired / revoked token
 *    → continue as anonymous
 *
 * This middleware is intentionally different from authenticate().
 * It must NEVER reject a public request merely because the
 * visitor is not authenticated.
 */
export async function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authorization = req.headers.authorization;

    /*
     * No Authorization header means anonymous visitor.
     *
     * This is the normal case for users who are not logged in.
     */
    if (!authorization) {
      next();
      return;
    }

    const parts = authorization.trim().split(/\s+/);

    /*
     * Malformed Authorization header.
     *
     * Because this is optional authentication, we simply
     * treat the request as anonymous.
     */
    if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
      next();
      return;
    }

    const accessToken = parts[1];

    /*
     * Verify:
     * - JWT signature
     * - JWT expiration
     * - userId
     * - role
     * - sessionId
     */
    const payload = await verifyAccessToken(accessToken);

    /*
     * JWT validity alone is not enough.
     *
     * The authentication system also requires the server-side
     * AuthSession to exist and remain active.
     */
    const session = await prisma.orm.public.AuthSession.first({
      id: payload.sessionId,
    });

    if (!session) {
      next();
      return;
    }

    /*
     * Make sure the JWT user and the database session belong
     * to the same user.
     */
    if (session.userId !== payload.userId) {
      next();
      return;
    }

    /*
     * A revoked session is no longer authenticated.
     */
    if (session.revokedAt !== null) {
      next();
      return;
    }

    /*
     * Prisma 8 PostgreSQL timestamptz is returned as
     * Temporal.Instant.
     */
    if (session.expiresAt.epochMilliseconds <= Date.now()) {
      next();
      return;
    }

    // Optional auth is used only for public graph personalization. Do not
    // expose private personalization for suspended or deactivated accounts,
    // and do not trust a potentially stale role claim.
    const user = await prisma.orm.public.User.first({
      id: payload.userId,
    });

    if (!user || user.status !== "ACTIVE") {
      next();
      return;
    }

    /*
     * Authentication succeeded.
     */
    const authenticatedRequest = req as AuthenticatedRequest;

    authenticatedRequest.auth = {
      userId: user.id,
      role: user.role,
      sessionId: session.id,
    };

    next();
  } catch {
    /*
     * IMPORTANT:
     *
     * Never reject the public knowledge-graph request because
     * optional authentication failed.
     *
     * Invalid / expired access token = anonymous visitor.
     */
    next();
  }
}
