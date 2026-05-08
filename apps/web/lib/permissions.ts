import type { AppRole } from "@mindcare/shared/roles";

export type { AppRole };

export const roleLabels: Record<AppRole, string> = {
  ADMIN: "Administrador",
  WELLBEING: "Bienestar / RR.HH.",
  TEAM_LEAD: "Lider de equipo",
  AUDITOR: "Auditor",
  EMPLOYEE: "Colaborador",
};

export const routePermissions = [
  {
    href: "/dashboard/alerts",
    roles: ["ADMIN", "WELLBEING", "AUDITOR"] satisfies AppRole[],
  },
  {
    href: "/dashboard/cases",
    roles: ["ADMIN", "WELLBEING", "AUDITOR"] satisfies AppRole[],
  },
  {
    href: "/dashboard/chat",
    roles: ["ADMIN", "WELLBEING", "TEAM_LEAD", "EMPLOYEE"] satisfies AppRole[],
  },
  {
    href: "/dashboard/messages",
    roles: ["ADMIN", "WELLBEING"] satisfies AppRole[],
  },
  {
    href: "/dashboard/organization",
    roles: ["ADMIN", "WELLBEING"] satisfies AppRole[],
  },
  {
    href: "/dashboard/privacy",
    roles: ["ADMIN", "WELLBEING", "AUDITOR"] satisfies AppRole[],
  },
  {
    href: "/dashboard",
    roles: ["ADMIN", "WELLBEING", "TEAM_LEAD", "AUDITOR", "EMPLOYEE"] satisfies AppRole[],
  },
];

export function getRoleLabel(role: string) {
  return roleLabels[role as AppRole] ?? role;
}

export function canAccessPath(role: string, pathname: string) {
  const permission = routePermissions.find((item) =>
    item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href),
  );

  if (!permission) {
    return true;
  }

  return permission.roles.includes(role as AppRole);
}
