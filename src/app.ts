import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";

import routes from "./routes/index.js";
import { AppError } from "./core/errors/AppError.js";
import errorHandler from "./core/errors/errorHandler.js";

const app = express();

const allowedOrigins = new Set(["http://localhost:3000", "https://afridiology.com", "https://admin.afridiology.com"]);

// This server returns API responses and does not serve the frontend's HTML or
// scripts, so CSP is left to the frontend host. The remaining Helmet defaults
// apply to successful responses and errors alike.
app.use(helmet({ contentSecurityPolicy: false }));

/*
 * ==================================================
 * CORS
 * ==================================================
 *
 * Allow only known frontend origins.
 * Requests without an Origin header (such as server-to-
 * server requests and curl) are not rejected by CORS.
 *
 * CORS is not an authentication or authorization control.
 */

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new AppError("Origin not allowed", 403, "CORS_ORIGIN_DENIED"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

/*
 * ==================================================
 * REQUEST PARSING
 * ==================================================
 */

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

/*
 * ==================================================
 * HEALTH CHECK
 * ==================================================
 */

app.get("/health", (_req, res) => {
  res.status(200).json({
    data: "Afridiology backend is running",
  });
});

/*
 * ==================================================
 * API ROUTES
 * ==================================================
 */

app.use("/api", routes);

/*
 * ==================================================
 * UNKNOWN ROUTES
 * ==================================================
 */

app.use((_req, res) => {
  res.status(404).json({
    data: "data not found",
  });
});

/*
 * ==================================================
 * GLOBAL ERROR HANDLER
 * ==================================================
 *
 * Must remain after all routes and the 404 handler.
 */

app.use(errorHandler);

export default app;
