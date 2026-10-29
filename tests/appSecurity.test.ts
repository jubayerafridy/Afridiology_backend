import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import { test } from "node:test";

import app from "../src/app.js";

test("allowed CORS origins succeed and untrusted origins receive a generic 403", async () => {
  const server = createServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/health`, {
      headers: { Origin: "https://afridiology.com" },
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(response.headers.get("access-control-allow-origin"), "https://afridiology.com");
    assert.equal(response.headers.get("access-control-allow-credentials"), "true");

    const rejected = await fetch(`http://127.0.0.1:${address.port}/health`, {
      headers: { Origin: "https://evil.example" },
    });
    assert.equal(rejected.status, 403);
    assert.deepEqual(await rejected.json(), { data: "Forbidden" });
    assert.notEqual(rejected.headers.get("access-control-allow-origin"), "https://evil.example");
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("security headers and generic errors are present on error responses", async () => {
  const server = createServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");

  try {
    const malformedJson = await fetch(`http://127.0.0.1:${address.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });
    assert.equal(malformedJson.status, 400);
    assert.deepEqual(await malformedJson.json(), { data: "Invalid request" });
    assert.equal(malformedJson.headers.get("x-content-type-options"), "nosniff");

    const missingRoute = await fetch(`http://127.0.0.1:${address.port}/missing`);
    assert.equal(missingRoute.status, 404);
    assert.deepEqual(await missingRoute.json(), { data: "data not found" });
    assert.equal(missingRoute.headers.get("x-content-type-options"), "nosniff");
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
