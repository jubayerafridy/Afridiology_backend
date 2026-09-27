import "dotenv/config";

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getOptionalEnv(name: string, fallback: string): string {
  const value = process.env[name]?.trim();

  return value || fallback;
}

function getPort(): number {
  const raw = getOptionalEnv("PORT", "5000");
  const port = Number(raw);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT value: ${raw}`);
  }

  return port;
}

function getNodeEnv(): "development" | "test" | "production" {
  const value = getOptionalEnv("NODE_ENV", "development");

  if (value !== "development" && value !== "test" && value !== "production") {
    throw new Error(
      `Invalid NODE_ENV value: ${value}. Expected development, test, or production.`,
    );
  }

  return value;
}

export const env = Object.freeze({
  DATABASE_URL: getRequiredEnv("DATABASE_URL"),

  PORT: getPort(),

  NODE_ENV: getNodeEnv(),

  JWT_ACCESS_SECRET: getRequiredEnv("JWT_ACCESS_SECRET"),

  JWT_REFRESH_SECRET: getRequiredEnv("JWT_REFRESH_SECRET"),

  JWT_ACCESS_EXPIRES_IN: getOptionalEnv("JWT_ACCESS_EXPIRES_IN", "15m"),

  JWT_REFRESH_EXPIRES_IN: getOptionalEnv("JWT_REFRESH_EXPIRES_IN", "30d"),

  AUTH_REFRESH_COOKIE_NAME: getOptionalEnv(
    "AUTH_REFRESH_COOKIE_NAME",
    "afridiology_refresh",
  ),
});

export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";
export const isTest = env.NODE_ENV === "test";
