import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";

import routes from "./routes/index.js";
import errorHandler from "./core/errors/errorHandler.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Afridiology backend is running",
  });
});

app.use("/api", routes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    code: "ROUTE_NOT_FOUND",
    message: "Route not found",
  });
});

app.use(errorHandler);

export default app;
