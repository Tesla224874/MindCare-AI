import test from "node:test";
import assert from "node:assert/strict";
import { createSessionPayload, createSessionToken, verifySessionToken } from "../lib/auth.ts";

test("createSessionToken produces a verifiable session", () => {
  const payload = createSessionPayload({
    userId: "user_test",
    organizationId: "org_test",
    role: "ADMIN",
  });
  const token = createSessionToken(payload);
  const verified = verifySessionToken(token);

  assert.deepEqual(verified, payload);
});

test("verifySessionToken rejects tampered payloads", () => {
  const payload = createSessionPayload({
    userId: "user_test",
    organizationId: "org_test",
    role: "ADMIN",
  });
  const token = createSessionToken(payload);
  const [encodedPayload, signature] = token.split(".");
  const tamperedPayload = Buffer.from(
    JSON.stringify({
      ...payload,
      role: "AUDITOR",
    }),
  ).toString("base64url");

  assert.notEqual(tamperedPayload, encodedPayload);
  assert.equal(verifySessionToken(`${tamperedPayload}.${signature}`), null);
});

test("verifySessionToken rejects expired sessions", () => {
  const token = createSessionToken({
    userId: "user_test",
    organizationId: "org_test",
    role: "ADMIN",
    expiresAt: Date.now() - 1000,
  });

  assert.equal(verifySessionToken(token), null);
});

test("verifySessionToken rejects empty or malformed tokens", () => {
  assert.equal(verifySessionToken(null), null);
  assert.equal(verifySessionToken(""), null);
  assert.equal(verifySessionToken("not-a-token"), null);
});

test("session creation rejects weak production secrets", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousSecret = process.env.AUTH_SECRET;

  Reflect.set(process.env, "NODE_ENV", "production");
  process.env.AUTH_SECRET = "short";

  assert.throws(() =>
    createSessionToken({
      userId: "user_test",
      organizationId: "org_test",
      role: "ADMIN",
      expiresAt: Date.now() + 1000,
    }),
  );

  if (previousNodeEnv === undefined) {
    Reflect.deleteProperty(process.env, "NODE_ENV");
  } else {
    Reflect.set(process.env, "NODE_ENV", previousNodeEnv);
  }

  if (previousSecret === undefined) {
    delete process.env.AUTH_SECRET;
  } else {
    process.env.AUTH_SECRET = previousSecret;
  }
});
