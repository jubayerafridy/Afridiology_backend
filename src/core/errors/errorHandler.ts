import type { ErrorRequestHandler } from "express";
import { AppError } from "./AppError.js";
import { isDevelopment } from "../../config/env.js";

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      code: error.code,
      message: error.message,
    });

    return;
  }

  console.error(error);

  res.status(500).json({
    success: false,
    code: "INTERNAL_SERVER_ERROR",
    message: isDevelopment
      ? error instanceof Error
        ? error.message
        : "Unknown error"
      : "Internal server error",
  });
};

export default errorHandler;
