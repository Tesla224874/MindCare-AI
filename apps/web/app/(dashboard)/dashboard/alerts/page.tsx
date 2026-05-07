import { connection } from "next/server";
import { AlertCircle, Bell, CheckCircle2, Clock, XCircle } from "lucide-react";
import { AlertStatusManager } from "@/components/ui/alert-status-manager";
import { requireRoles } from "@/lib/authorization";
import { getAlertsOverview } from "@/lib/data/alerts";
import { openCaseFromAlertAction } from "../cases/actions";
import { updateAlertStatusAction } from "./actions";

function getScope(user: Awaited<ReturnType<typeof requireRoles>>) {
  if (user.role === "TEAM_LEAD" || user.role === "EMPLOYEE") {
    return {
      organizationId: user.organization.id,
      teamId: user.team?.id,
      label: user.team?.name ?? "Mi equipo",
    };
  }

  return {
    organizationId: user.organization.id,
    teamId: null,
    label: user.organization.name,
  };
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function AlertsPage() {
  await connection();

  const currentUser = await requireRoles(["ADMIN", "WELLBEING", "AUDITOR"]);
  const scope = getScope(currentUser);
  const overview = await getAlertsOverview(scope);
  const canManageAlerts = currentUser.role === "ADMIN" || currentUser.role === "WELLBEING";
  const canFilterAlerts = canManageAlerts;

  const metrics = [
    {
      label: "Abiertas",
      value: String(overview.counts.OPEN),
      detail: "Requieren primera revision",
      icon: AlertCircle,
      tone: "bg-rose-50 text-rose-700 border-rose-200",
    },
    {
      label: "En revision",
      value: String(overview.counts.IN_REVIEW),
      detail: "Seguimiento humano activo",
      icon: Clock,
      tone: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      label: "Resueltas",
      value: String(overview.counts.RESOLVED),
      detail: "Cerradas con accion",
      icon: CheckCircle2,
      tone: "bg-teal-50 text-teal-700 border-teal-200",
    },
    {
      label: "Descartadas",
      value: String(overview.counts.DISMISSED),
      detail: "Sin accion requerida",
      icon: XCircle,
      tone: "bg-slate-50 text-slate-700 border-slate-200",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-700">Datos desde PostgreSQL</p>
            <h2 className="mt-1 text-xl font-semibold tracking-normal text-slate-950">
              Alertas preventivas de {scope.label}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Las alertas orientan seguimiento humano y no deben usarse como diagnostico clinico ni medida
              disciplinaria.
            </p>
          </div>
          <div className="flex w-fit items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
            <Bell className="h-4 w-4" aria-hidden="true" />
            Revision humana
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <article key={metric.label} className={`rounded-lg border bg-white p-5 ${metric.tone}`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{metric.label}</p>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="mt-5 text-3xl font-semibold tracking-normal">{metric.value}</p>
              <p className="mt-1 text-sm opacity-80">{metric.detail}</p>
            </article>
          );
        })}
      </section>

      <AlertStatusManager
        action={updateAlertStatusAction}
        openCaseAction={openCaseFromAlertAction}
        canManage={canManageAlerts}
        canFilter={canFilterAlerts}
        alerts={overview.alerts.map((alert) => ({
          id: alert.id,
          title: alert.title,
          summary: alert.summary,
          level: alert.level,
          status: alert.status,
          recommendedAction: alert.recommendedAction,
          teamName: alert.team?.name ?? null,
          openedByName: alert.openedBy?.name ?? null,
          createdAt: formatDate(alert.createdAt),
          caseId: alert.case?.id ?? null,
          caseStatus: alert.case?.status ?? null,
        }))}
      />
    </div>
  );
}
