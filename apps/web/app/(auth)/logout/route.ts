import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function clearSession(request: Request) {
  const rawCookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
  const session = verifySessionToken(rawCookie);

  if (session) {
    const user = await prisma.user.findFirst({
      where: {
        id: session.userId,
        organizationId: session.organizationId,
      },
      select: {
        id: true,
      },
    });

    if (user) {
      await prisma.auditLog.create({
        data: {
          organizationId: session.organizationId,
          userId: session.userId,
          action: "auth.logout",
          entityType: "User",
          entityId: session.userId,
        },
      });
    }
  }

  const response = NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  response.cookies.delete(SESSION_COOKIE);

  return response;
}

export async function GET(request: Request) {
  return clearSession(request);
}

export async function POST(request: Request) {
  return clearSession(request);
}
