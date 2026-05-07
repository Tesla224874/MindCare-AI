import Link from "next/link";
import { connection } from "next/server";
import type { Metadata } from "next";
import {
  AlertTriangle,
  Bell,
  HeartPulse,
  MessageSquareText,
  ShieldCheck,
  
  TrendingDown,
  UsersRound,
} from "lucide-react";
import { WellnessAdvice } from "@/components/ui/wellness-advice";
import { canAccessPath } from "@/lib/permissions";
import { getDashboardOverview } from "@/lib/data/dashboard";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Dashboard - MindCare.AI",
  description: "Resumen del bienestar organizacional",
};

const levelLabels: Record<string, string> = {
  LOW: "Bajo",
  OBSERVATION: "Observacion",
  PREVENTIVE_ATTENTION: "Atencion preventiva",
  HIGH: "Riesgo alto",
};

const alertStatusLabels: Record<string, string> = {
  OPEN: "Abierta",
  IN_REVIEW: "En revision",
  RESOLVED: "Resuelta",
  DISMISSED: "Descartada",
};

function getScope(user: Awaited<ReturnType<typeof getCurrentUser>>) {
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

function canUseDashboardFilters(role: string) {
  return role === "ADMIN" || role === "WELLBEING" || role === "TEAM_LEAD";
}

function getDateFrom(dateRange?: string) {
  const dateFrom = new Date();

  if (dateRange === "90d") {
    dateFrom.setDate(dateFrom.getDate() - 90);
    return dateFrom;
  }

  if (dateRange === "30d") {
    dateFrom.setDate(dateFrom.getDate() - 30);
    return dateFrom;
  }

  dateFrom.setDate(dateFrom.getDate() - 7);
  return dateFrom;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    dateRange?: string;
    riskLevel?: string;
    alertStatus?: string;
  }>;
}) {
  await connection();

  const currentUser = await getCurrentUser();
  const scope = getScope(currentUser);
  const params = await searchParams;
  const overview = await getDashboardOverview(scope);
  const isEmployee = currentUser.role === "EMPLOYEE";
  const allowFilters = canUseDashboardFilters(currentUser.role);
  const canUseMessageLab = canAccessPath(currentUser.role, "/dashboard/messages");
  const dateFrom = getDateFrom(allowFilters ? params.dateRange : undefined);

  const filteredAlerts = allowFilters
    ? overview.recentAlerts.filter((alert) => {
        const matchesRiskLevel = !params.riskLevel || alert.level === params.riskLevel;
        const matchesStatus = !params.alertStatus || alert.status === params.alertStatus;
        const matchesDate = alert.createdAt >= dateFrom;

        return matchesRiskLevel && matchesStatus && matchesDate;
      })
    : overview.recentAlerts;

  const metrics = [
    {
      label: "Indice de bienestar",
      value: String(overview.metrics.wellbeingIndex),
      detail: overview.metrics.analysesCount > 0 ? "Calculado desde analisis" : "Sin analisis suficientes",
      icon: HeartPulse,
      tone: "bg-teal-50 text-teal-700 border-teal-200",
    },
    {
      label: "Alertas preventivas",
      value: String(overview.metrics.openAlerts),
      detail: "Abiertas o en revision",
      icon: Bell,
      tone: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      label: "Riesgo agregado",
      value: `${overview.metrics.aggregatedRisk}%`,
      detail: `${overview.metrics.messagesCount} mensajes minimizados`,
      icon: TrendingDown,
      tone: "bg-blue-50 text-blue-700 border-blue-200",
    },
    ...(isEmployee
      ? []
      : [
          {
            label: "Usuarios activos",
            value: String(overview.metrics.activeUsers),
            detail: scope.label,
            icon: UsersRound,
            tone: "bg-slate-50 text-slate-700 border-slate-200",
          },
        ]),
  ];
  const activeFilterLabels = allowFilters
    ? [
        params.dateRange && params.dateRange !== "7d" ? `Fecha: ${params.dateRange}` : null,
        params.riskLevel ? `Riesgo: ${levelLabels[params.riskLevel] ?? params.riskLevel}` : null,
        params.alertStatus ? `Estado: ${alertStatusLabels[params.alertStatus] ?? params.alertStatus}` : null,
      ].filter(Boolean)
    : [];

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <p className="text-sm font-medium text-blue-700">Datos desde PostgreSQL</p>
        <h2 className="mt-1 text-xl font-semibold tracking-normal text-slate-950">
          Resumen preventivo de {scope.label}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          {isEmployee
            ? "Esta vista muestra senales agregadas de bienestar personal y recomendaciones preventivas."
            : "Esta vista combina usuarios activos, alertas, mensajes minimizados y analisis guardados en la base de datos."}
        </p>
      </section>

      <section className={`grid gap-4 md:grid-cols-2 ${isEmployee ? "xl:grid-cols-3" : "xl:grid-cols-4"}`}>
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

      {isEmployee ? (
        <WellnessAdvice
          aggregatedRisk={overview.metrics.aggregatedRisk}
          wellbeingIndex={overview.metrics.wellbeingIndex}
          signalLabels={overview.signals.map((signal) => signal.label)}
        />
      ) : (
        <>
          <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold tracking-normal">Senales principales</h2>
                  <p className="mt-1 text-sm text-slate-500">Vista agregada de los ultimos analisis</p>
                </div>
                <MessageSquareText className="h-5 w-5 text-slate-500" aria-hidden="true" />
              </div>

              <div className="mt-6 space-y-5">
                {overview.signals.length > 0 ? (
                  overview.signals.map((signal) => (
                    <div key={signal.label}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">{signal.label}</span>
                        <span className="text-slate-500">
                          {signal.count} de {overview.totalSignalMatches}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div
                          className={`h-2 rounded-full ${signal.color}`}
                          style={{ width: `${signal.value}%` }}
                          aria-hidden="true"
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        La barra representa su peso relativo entre las senales detectadas recientemente.
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    Todavia no hay senales agregadas. Guarda analisis de texto para alimentar este resumen.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold tracking-normal">Criterio etico</h2>
                  <p className="mt-1 text-sm text-slate-500">Regla base del producto</p>
                </div>
                <ShieldCheck className="h-5 w-5 text-teal-600" aria-hidden="true" />
              </div>
              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <p>No se muestran diagnosticos clinicos a la empresa.</p>
                <p>Las alertas deben derivar a apoyo humano, no a sanciones.</p>
                <p>Los reportes ejecutivos deben ser agregados y auditables.</p>
              </div>
              {canUseMessageLab ? (
                <Link
                  className="mt-5 inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                  href="/dashboard/messages"
                >
                  Probar analizador de texto
                </Link>
              ) : null}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-normal">Alertas recientes</h2>
                <p className="mt-1 text-sm text-slate-500">Registros reales desde PreventiveAlert</p>
                {activeFilterLabels.length > 0 ? (
                  <p className="mt-2 text-xs text-blue-600">Filtros activos: {activeFilterLabels.join(", ")}</p>
                ) : null}
              </div>
              <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />
            </div>

            <div className="mt-5 divide-y divide-slate-100">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert) => (
                  <div key={alert.id} className="grid gap-3 py-4 md:grid-cols-[1fr_180px_2fr] md:items-center">
                    <p className="font-medium text-slate-800">{alert.team?.name ?? overview.organization?.name}</p>
                    <span className="w-fit rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                      {levelLabels[alert.level] ?? alert.level}
                    </span>
                    <div>
                      <p className="font-medium text-slate-700">{alert.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">{alert.summary}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  {overview.recentAlerts.length === 0
                    ? "Todavia no hay alertas preventivas para este alcance."
                    : "No hay alertas que coincidan con los filtros seleccionados."}
                </p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
