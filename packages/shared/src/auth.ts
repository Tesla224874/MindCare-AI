/**
 * Shared authentication types and constants
 */

export type SessionRole = "ADMIN" | "WELLBEING" | "TEAM_LEAD" | "AUDITOR" | "EMPLOYEE";

export type SessionPayload = {
  userId: string;
  organizationId: string;
  role: SessionRole;
  expiresAt: number;
};

export const SESSION_COOKIE = "mindcare_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

export const DEMO_EMAIL = "admin@empresa.com";
export const DEMO_PASSWORD = "MindCareDemo2026";
