/**
 * Shared role and permission types
 */

export type AppRole = "ADMIN" | "WELLBEING" | "TEAM_LEAD" | "AUDITOR" | "EMPLOYEE";

export const roleLabels: Record<AppRole, string> = {
  ADMIN: "Administrador",
  WELLBEING: "Bienestar",
  TEAM_LEAD: "Lider de equipo",
  AUDITOR: "Auditor",
  EMPLOYEE: "Empleado",
};

export const roleDescriptions: Record<AppRole, string> = {
  ADMIN: "Acceso completo al sistema y configuración",
  WELLBEING: "Acceso a análisis y alertas de bienestar",
  TEAM_LEAD: "Acceso a datos del equipo y alertas",
  AUDITOR: "Acceso de solo lectura para auditoría",
  EMPLOYEE: "Acceso limitado a datos personales",
};
