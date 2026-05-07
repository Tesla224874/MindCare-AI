import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../lib/password.ts";

test("hashPassword stores passwords with the expected format", () => {
  const hash = hashPassword("MindCareDemo2026");
  const [prefix, salt, digest] = hash.split("$");

  assert.equal(prefix, "scrypt");
  assert.ok(salt.length > 10);
  assert.ok(digest.length > 40);
});

test("verifyPassword accepts the original password", () => {
  const hash = hashPassword("MindCareDemo2026");

  assert.equal(verifyPassword("MindCareDemo2026", hash), true);
});

test("verifyPassword rejects wrong or malformed input", () => {
  const hash = hashPassword("MindCareDemo2026");

  assert.equal(verifyPassword("wrong-password", hash), false);
  assert.equal(verifyPassword("MindCareDemo2026", null), false);
  assert.equal(verifyPassword("MindCareDemo2026", "invalid-hash"), false);
});
