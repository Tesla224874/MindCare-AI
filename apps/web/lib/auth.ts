import { createHmac, timingSafeEqual } from "node:crypto";

import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  DEMO_EMAIL,
  DEMO_PASSWORD,
  type SessionPayload,
  type SessionRole,
} from "@mindcare/shared/auth";

export { SESSION_COOKIE, SESSION_TTL_SECONDS, DEMO_EMAIL, DEMO_PASSWORD };
export type { SessionRole, SessionPayload };

const localFallbackSecret = "mindcare-ai-local-demo-secret";
const insecureProductionSecrets = new Set(["replace-with-a-long-random-secret", localFallbackSecret]);
 
function getSessionSecret() {
  const secret = process.env.AUTH_SECRET ?? localFallbackSecret;

  if (process.env.NODE_ENV === "production" && (secret.length < 32 || insecureProductionSecrets.has(secret))) {
    throw new Error("AUTH_SECRET must be a strong secret in production.");
  }

  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function safeEquals(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return timingSafeEqual(aBuffer, bBuffer);
}

export function createSessionToken(payload: SessionPayload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifySessionToken(token?: string | null): SessionPayload | null {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature || !safeEquals(signature, sign(encodedPayload))) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as SessionPayload;

    if (!payload.expiresAt || payload.expiresAt < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function createSessionPayload(payload: Omit<SessionPayload, "expiresAt">): SessionPayload {
  return {
    ...payload,
    expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000,
  };
}
