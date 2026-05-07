import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentUser } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await getCurrentUser();

  return (
    <DashboardShell
      currentUser={{
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        teamName: currentUser.team?.name ?? null,
        organizationName: currentUser.organization.name,
      }}
    >
      {children}
    </DashboardShell>
  );
}
