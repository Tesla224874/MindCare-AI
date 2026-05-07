import { redirect } from "next/navigation";
import { type AppRole, canAccessPath } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";

export async function requireRoles(allowedRoles: AppRole[]) {
  const currentUser = await getCurrentUser();

  if (!allowedRoles.includes(currentUser.role)) {
    redirect("/dashboard");
  }

  return currentUser;
}

export async function requirePathAccess(pathname: string) {
  const currentUser = await getCurrentUser();

  if (!canAccessPath(currentUser.role, pathname)) {
    redirect("/dashboard");
  }

  return currentUser;
}
