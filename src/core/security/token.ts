import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

import { env } from "../../config/env.js";

/**
 * Generate a cryptographically secure random token.
 *
 * 32 bytes = 256 bits of entropy.
 */
export function generateToken(byteLength = 32): string {
  if (!Number.isInteger(byteLength) || byteLength < 32) {
    throw new Error("Token byte length must be an integer >= 32");
  }

  return randomBytes(byteLength).toString("base64url");
}

/**
 * Hash a token before storing it in the database.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/**
 * Constant-time token comparison.
 */
export function tokensMatch(token: string, tokenHash: string): boolean {
  const actualHash = Buffer.from(hashToken(token), "utf8");

  const expectedHash = Buffer.from(tokenHash, "utf8");

  if (actualHash.length !== expectedHash.length) {
    return false;
  }

  return timingSafeEqual(actualHash, expectedHash);
}

/**
 * Optional HMAC-based token digest.
 *
 * Useful when we want database token hashes to be
 * additionally protected by a server-side secret.
 */
export function hashTokenWithSecret(token: string): string {
  return createHmac("sha256", env.JWT_REFRESH_SECRET)
    .update(token, "utf8")
    .digest("hex");
}
