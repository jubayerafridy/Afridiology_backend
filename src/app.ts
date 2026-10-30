import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";

import routes from "./routes/index.js";
import { env } from "./config/env.js";
import { AppError } from "./core/errors/AppError.js";
import errorHandler from "./core/errors/errorHandler.js";

const app = express();

/*
 * ==================================================
 * ALLOWED FRONTEND ORIGINS
 * ==================================================
 */

const allowedOrigins = new Set(["https://afridiology.com", "https://admin.afridiology.com", "http://localhost:3000"]);
/*
 * ==================================================
 * SECURITY HEADERS
 * ==================================================
 *
 * The frontend serves HTML and scripts, so its CSP is
 * configured separately. API responses use Helmet's
 * remaining security headers.
 */

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

/*
 * ==================================================
 * CORS
 * ==================================================
 *
 * Allow requests only from registered frontend origins.
 *
 * Both student and admin portals are allowed to use
 * credentialed API requests.
 *
 * Requests without Origin headers are permitted for
 * server-to-server communication and command-line tools.
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

    optionsSuccessStatus: 204,
  }),
);

/*
 * ==================================================
 * REQUEST PARSING
 * ==================================================
 */

app.use(
  express.json({
    limit: "1mb",
  }),
);

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
