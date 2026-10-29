import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../src/core/security/jwt.js";

const identity = {
  userId: "user-1",
  role: "STUDENT",
  sessionId: "session-1",
} as const;

test("access and refresh JWTs are verifiable only with their own token type", async () => {
  const accessToken = await createAccessToken(identity);
  const refreshToken = await createRefreshToken({
    userId: identity.userId,
    sessionId: identity.sessionId,
  });

  assert.deepEqual(await verifyAccessToken(accessToken), identity);
  assert.deepEqual(await verifyRefreshToken(refreshToken), {
    userId: identity.userId,
    sessionId: identity.sessionId,
  });
  await assert.rejects(() => verifyRefreshToken(accessToken));
  await assert.rejects(() => verifyAccessToken(refreshToken));
});

test("refresh JWTs have a unique jti and expiration", async () => {
  const payloads = await Promise.all(
    Array.from({ length: 2 }, () =>
      createRefreshToken({ userId: identity.userId, sessionId: identity.sessionId }),
    ),
  );
  assert.notEqual(payloads[0], payloads[1]);

  const encodedPayload = payloads[0]!.split(".")[1]!;
  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as {
    jti?: string;
    exp?: number;
  };
  assert.equal(typeof payload.jti, "string");
  assert.ok((payload.jti?.length ?? 0) > 0);
  assert.equal(typeof payload.exp, "number");
});
