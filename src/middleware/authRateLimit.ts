import { rateLimit } from "express-rate-limit";

export function createAuthRateLimiter(windowMs: number, limit: number) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { data: "Too many requests" },
  });
}

// The built-in memory store is per process. A shared store is required when
// multiple application instances must enforce one aggregate quota.
export const registrationRateLimit = createAuthRateLimiter(60 * 60 * 1000, 5);
export const loginRateLimit = createAuthRateLimiter(15 * 60 * 1000, 10);
export const refreshRateLimit = createAuthRateLimiter(15 * 60 * 1000, 30);
