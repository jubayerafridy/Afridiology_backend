import type { ErrorRequestHandler } from "express";
import { AppError } from "../../core/errors/AppError.js";

/** Keeps student-route failures from reaching the development error handler. */
function getSafeErrorLabel(error: unknown): string {
  if (!(error instanceof Error)) return typeof error;
  const code = (error as Error & { code?: unknown }).code;
  return typeof code === "string" && /^[A-Z0-9_.-]{1,64}$/.test(code)
    ? `${error.name}:${code}`
    : error.name;
}

export const studentErrorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (res.headersSent) {
    console.error("Student API failed after response started", getSafeErrorLabel(error));
    res.end();
    return;
  }

  if (error instanceof AppError) {
    if (error.statusCode === 404) {
      res.status(404).json("data not found");
      return;
    }

    const statusCode = [400, 401, 403, 404, 429].includes(error.statusCode)
      ? error.statusCode
      : 500;
    const publicMessage = statusCode === 400
      ? "invalid request"
      : statusCode === 401
        ? "authentication required"
        : statusCode === 403
          ? "forbidden"
          : statusCode === 404
            ? "data not found"
            : statusCode === 429
              ? "too many requests"
              : "error response";
    res.status(statusCode).json(publicMessage);
    return;
  }

  if (error instanceof Error && error.name === "NOT_FOUND") {
    res.status(404).json("data not found");
    return;
  }

  if (error instanceof Error && error.name === "BAD_REQUEST") {
    res.status(400).json("invalid request");
    return;
  }

  // Log only the error class; request data and database details stay out of logs.
  console.error("Unexpected student API error", getSafeErrorLabel(error));
  res.status(500).json("error response");
};
