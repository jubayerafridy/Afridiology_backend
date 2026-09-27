import type { NextFunction, Request, Response } from "express";

import { AppError } from "../core/errors/AppError.js";

type UserRole =
  | "STUDENT"
  | "TEACHER"
  | "AUTHOR"
  | "MODERATOR"
  | "ADMIN"
  | "SUPER_ADMIN";

interface AuthenticatedRequest extends Request {
  auth?: {
    userId: number;
    role: string;
    sessionId: number;
  };
}

/*
 * ==================================================
 * AUTHORIZE
 * ==================================================
 *
 * Usage:
 *
 * router.post(
 *   "/...",
 *   authenticate,
 *   requireActiveUser,
 *   authorize("ADMIN", "SUPER_ADMIN"),
 *   controller,
 * );
 *
 * The middleware checks whether the authenticated
 * user's role is included in the allowed roles.
 */

export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const authenticatedRequest = req as AuthenticatedRequest;

      if (!authenticatedRequest.auth) {
        throw new AppError(
          "Authentication required",
          401,
          "AUTHENTICATION_REQUIRED",
        );
      }

      const userRole = authenticatedRequest.auth.role;

      if (!isUserRole(userRole)) {
        throw new AppError("Forbidden", 403, "FORBIDDEN");
      }

      if (!allowedRoles.includes(userRole)) {
        throw new AppError(
          "You do not have permission to perform this action",
          403,
          "FORBIDDEN",
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/*
 * ==================================================
 * ROLE VALIDATION
 * ==================================================
 */

function isUserRole(value: string): value is UserRole {
  return (
    value === "STUDENT" ||
    value === "TEACHER" ||
    value === "AUTHOR" ||
    value === "MODERATOR" ||
    value === "ADMIN" ||
    value === "SUPER_ADMIN"
  );
}
