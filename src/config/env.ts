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
    throw new Error(`Invalid NODE_ENV value: ${value}. Expected development, test, or production.`);
  }

  return value;
}

/**
 * Require independently configured, cryptographically strong JWT secrets.
 *
 * HS256 requires a key with at least 256 bits of cryptographic strength.
 * Checking the UTF-8 byte length is a basic configuration safeguard;
 * it does not prove that a secret is random or unpredictable.
 */
function getJwtSecret(name: string): string {
  const secret = getRequiredEnv(name);

  if (Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error(`${name} must contain at least 32 UTF-8 bytes. Use a cryptographically random secret.`);
  }

  return secret;
}

/**
 * Accept positive integer durations with an explicit unit.
 * Supported units match common jose duration formats.
 */
function getTokenExpiration(name: string, fallback: string): { value: string; milliseconds: number } {
  const value = getOptionalEnv(name, fallback);

  const match = /^([1-9]\d*)\s*(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)$/i.exec(value);

  if (!match) {
    throw new Error(`Invalid ${name} value. Use a positive integer followed by a supported time unit, such as 15m or 30d.`);
  }

  const amount = Number(match[1]);

  const unit = match[2]![0]!.toLowerCase();

  const secondsPerUnit: Record<string, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
    w: 7 * 24 * 60 * 60,
    y: 365.25 * 24 * 60 * 60,
  };

  const milliseconds = Math.round(amount * secondsPerUnit[unit]! * 1000);

  if (!Number.isSafeInteger(amount) || !Number.isSafeInteger(milliseconds)) {
    throw new Error(`${name} duration is too large.`);
  }

  return { value, milliseconds };
}

const accessSecret = getJwtSecret("JWT_ACCESS_SECRET");
const refreshSecret = getJwtSecret("JWT_REFRESH_SECRET");

if (accessSecret === refreshSecret) {
  throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different.");
}

const accessExpiration = getTokenExpiration("JWT_ACCESS_EXPIRES_IN", "15m");

const refreshExpiration = getTokenExpiration("JWT_REFRESH_EXPIRES_IN", "30d");

const studentRefreshCookieName = getOptionalEnv("AUTH_REFRESH_COOKIE_NAME", "afridiology_refresh");

const adminRefreshCookieName = getOptionalEnv("AUTH_ADMIN_REFRESH_COOKIE_NAME", "afridiology_admin_refresh");

if (studentRefreshCookieName === adminRefreshCookieName) {
  throw new Error("AUTH_REFRESH_COOKIE_NAME and AUTH_ADMIN_REFRESH_COOKIE_NAME must be different.");
}

export const env = Object.freeze({
  DATABASE_URL: getRequiredEnv("DATABASE_URL"),

  PORT: getPort(),

  NODE_ENV: getNodeEnv(),

  JWT_ACCESS_SECRET: accessSecret,

  JWT_REFRESH_SECRET: refreshSecret,

  JWT_ACCESS_EXPIRES_IN: accessExpiration.value,

  JWT_REFRESH_EXPIRES_IN: refreshExpiration.value,

  JWT_REFRESH_EXPIRES_IN_MS: refreshExpiration.milliseconds,

  AUTH_REFRESH_COOKIE_NAME: studentRefreshCookieName,

  AUTH_ADMIN_REFRESH_COOKIE_NAME: adminRefreshCookieName,
});

export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";
export const isTest = env.NODE_ENV === "test";
