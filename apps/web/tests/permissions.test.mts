import test from "node:test";
import assert from "node:assert/strict";
import { canAccessPath, getRoleLabel } from "../lib/permissions.ts";

test("admin can access all dashboard sections", () => {
  assert.equal(canAccessPath("ADMIN", "/dashboard"), true);
  assert.equal(canAccessPath("ADMIN", "/dashboard/alerts"), true);
  assert.equal(canAccessPath("ADMIN", "/dashboard/messages"), true);
  assert.equal(canAccessPath("ADMIN", "/dashboard/organization"), true);
  assert.equal(canAccessPath("ADMIN", "/dashboard/privacy"), true);
});

test("auditor can read alerts and privacy but cannot access operational tools", () => {
  assert.equal(canAccessPath("AUDITOR", "/dashboard"), true);
  assert.equal(canAccessPath("AUDITOR", "/dashboard/alerts"), true);
  assert.equal(canAccessPath("AUDITOR", "/dashboard/privacy"), true);
  assert.equal(canAccessPath("AUDITOR", "/dashboard/messages"), false);
  assert.equal(canAccessPath("AUDITOR", "/dashboard/organization"), false);
});

test("employee only has dashboard access in the current MVP", () => {
  assert.equal(canAccessPath("EMPLOYEE", "/dashboard"), true);
  assert.equal(canAccessPath("EMPLOYEE", "/dashboard/alerts"), false);
  assert.equal(canAccessPath("EMPLOYEE", "/dashboard/messages"), false);
  assert.equal(canAccessPath("EMPLOYEE", "/dashboard/privacy"), false);
});

test("role labels are user friendly", () => {
  assert.equal(getRoleLabel("TEAM_LEAD"), "Lider de equipo");
  assert.equal(getRoleLabel("UNKNOWN"), "UNKNOWN");
});
