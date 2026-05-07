"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionPayload, createSessionToken, SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const maxLoginAttempts = 5;
const loginWindowMs = 5 * 60 * 1000;

function getSafeNextPath(value: FormDataEntryValue | null) {
  const nextPath = String(value ?? "/dashboard");

  if (!nextPath.startsWith("/dashboard")) {
    return "/dashboard";
  }

  return nextPath;
}

function getRateLimitKey(email: string) {
  return email || "anonymous";
}

function isRateLimited(key: string) {
  const attempt = loginAttempts.get(key);

  if (!attempt) {
    return false;
  }

  if (attempt.resetAt < Date.now()) {
    loginAttempts.delete(key);
    return false;
  }

  return attempt.count >= maxLoginAttempts;
}

function recordFailedAttempt(key: string) {
  const now = Date.now();
  const attempt = loginAttempts.get(key);

  if (!attempt || attempt.resetAt < now) {
    loginAttempts.set(key, {
      count: 1,
      resetAt: now + loginWindowMs,
    });
    return;
  }

  loginAttempts.set(key, {
    ...attempt,
    count: attempt.count + 1,
  });
}

function clearFailedAttempts(key: string) {
  loginAttempts.delete(key);
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const nextPath = getSafeNextPath(formData.get("next"));
  const rateLimitKey = getRateLimitKey(email);

  if (isRateLimited(rateLimitKey)) {
    redirect("/login?error=rate-limit");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      organizationId: true,
      role: true,
      passwordHash: true,
      isActive: true,
    },
  });

  if (!user?.isActive || !verifyPassword(password, user.passwordHash)) {
    recordFailedAttempt(rateLimitKey);
    redirect("/login?error=invalid");
  }

  clearFailedAttempts(rateLimitKey);

  const cookieStore = await cookies();
  const token = createSessionToken(
    createSessionPayload({
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
    }),
  );

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      action: "auth.login",
      entityType: "User",
      entityId: user.id,
    },
  });

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
  });

  redirect(nextPath);
}
