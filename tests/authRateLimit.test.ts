import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import { after, before, test } from "node:test";
import express from "express";

import { createAuthRateLimiter } from "../src/middleware/authRateLimit.js";

const app = express();
app.post("/limited", createAuthRateLimiter(60_000, 2), (_req, res) => {
  res.status(200).json({ data: "ok" });
});

const server = createServer(app);
let baseUrl: string;

before(async () => {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  server.close();
  await once(server, "close");
});

test("auth rate limiter allows normal requests and rejects requests over its limit", async () => {
  for (let i = 0; i < 2; i += 1) {
    const response = await fetch(`${baseUrl}/limited`, { method: "POST" });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { data: "ok" });
  }

  const limitedResponse = await fetch(`${baseUrl}/limited`, { method: "POST" });
  assert.equal(limitedResponse.status, 429);
  assert.deepEqual(await limitedResponse.json(), { data: "Too many requests" });
});
