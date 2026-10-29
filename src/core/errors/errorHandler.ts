import type { ErrorRequestHandler } from "express";

import { AppError } from "./AppError.js";

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (isRequestBodyError(error)) {
    const statusCode = error.status;
    res.status(statusCode).json({
      data: statusCode === 413 ? "Request too large" : "Invalid request",
    });
    return;
  }

  if (error instanceof AppError) {
    const statusCode = error.statusCode;

    // Expose only approved generic messages.
    if (statusCode === 401) {
      res.status(401).json({
        data: "Authentication required",
      });
      return;
    }

    if (statusCode === 403 || error.code === "CORS_ORIGIN_DENIED") {
      res.status(403).json({
        data: "Forbidden",
      });
      return;
    }

    if (statusCode === 404) {
      res.status(404).json({
        data: "data not found",
      });
      return;
    }

    if (statusCode === 409) {
      res.status(409).json({
        data: "Request conflict",
      });
      return;
    }

    if (statusCode >= 400 && statusCode < 500) {
      res.status(statusCode).json({
        data: "Invalid request",
      });
      return;
    }

    console.error(error);

    res.status(500).json({
      data: "error response",
    });
    return;
  }

  // Keep internal details in server logs, not in public responses.
  console.error(error);

  res.status(500).json({
    data: "error response",
  });
};

function isRequestBodyError(
  error: unknown,
): error is { status: number; type: string } {
  if (typeof error !== "object" || error === null || !("status" in error) || !("type" in error)) {
    return false;
  }

  const candidate = error as { status: unknown; type: unknown };

  return (
    (candidate.status === 400 && candidate.type === "entity.parse.failed") ||
    (candidate.status === 413 && candidate.type === "entity.too.large")
  );
}

export default errorHandler;
