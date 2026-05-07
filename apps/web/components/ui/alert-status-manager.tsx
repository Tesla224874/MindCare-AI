"use client";

import { useActionState, useMemo, useState } from "react";
import { AlertTriangle, ClipboardList, RotateCcw, Search } from "lucide-react";
import type { CaseActionState } from "@/app/(dashboard)/dashboard/cases/actions";
import type { UpdateAlertState } from "@/app/(dashboard)/dashboard/alerts/actions";

type AlertItem = {
  id: string;
  title: string;
  summary: string;
  level: string;
  status: string;
  recommendedAction: string;
  teamName: string | null;
  openedByName: string | null;
  createdAt: string;
  caseId: string | null;
  caseStatus: string | null;
};

type AlertStatusManagerProps = {
  alerts: AlertItem[];
  canManage: boolean;
  canFilter: boolean;
  action: (previousState: UpdateAlertState, formData: FormData) => Promise<UpdateAlertState>;
  openCaseAction: (previousState: CaseActionState, formData: FormData) => Promise<CaseActionState>;
};

const initialState: UpdateAlertState = {
  status: "idle",
  message: "",
};

const initialCaseState: CaseActionState = {
  status: "idle",
  message: "",
};

const statusLabels: Record<string, string> = {
  OPEN: "Abierta",
  IN_REVIEW: "En revision",
  RESOLVED: "Resuelta",
  DISMISSED: "Descartada",
};

const levelLabels: Record<string, string> = {
  LOW: "Bajo",
  OBSERVATION: "Observacion",
  PREVENTIVE_ATTENTION: "Atencion preventiva",
  HIGH: "Riesgo alto",
};

const caseStatusLabels: Record<string, string> = {
  TRIAGE: "Triage",
  ACTIVE: "Activo",
  MONITORING: "Monitoreo",
  ESCALATED: "Escalado",
  CLOSED: "Cerrado",
};

const statuses = ["OPEN", "IN_REVIEW", "RESOLVED", "DISMISSED"];
const levels = ["LOW", "OBSERVATION", "PREVENTIVE_ATTENTION", "HIGH"];

export function AlertStatusManager({ alerts, canManage, canFilter, action, openCaseAction }: AlertStatusManagerProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [caseState, caseFormAction, isCasePending] = useActionState(openCaseAction, initialCaseState);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [levelFilter, setLevelFilter] = useState("ALL");

  const filteredAlerts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return alerts.filter((alert) => {
      const matchesStatus = statusFilter === "ALL" || alert.status === statusFilter;
      const matchesLevel = levelFilter === "ALL" || alert.level === levelFilter;
      const searchableText = [
        alert.title,
        alert.summary,
        alert.recommendedAction,
        alert.teamName ?? "",
        alert.openedByName ?? "",
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);

      return matchesStatus && matchesLevel && matchesQuery;
    });
  }, [alerts, levelFilter, query, statusFilter]);

  function clearFilters() {
    setQuery("");
    setStatusFilter("ALL");
    setLevelFilter("ALL");
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-normal">Alertas preventivas</h2>
          <p className="mt-1 text-sm text-slate-500">Revision humana de alertas generadas por el sistema.</p>
        </div>
        <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />
      </div>

      {canFilter ? (
        <>
          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_180px_180px_auto] lg:items-end">
            <label className="block text-sm font-medium text-slate-700">
              Buscar alerta
              <span className="mt-2 flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 focus-within:border-blue-500 focus-within:bg-white">
                <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm font-normal text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="Titulo, equipo o accion"
                />
              </span>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Estado
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="ALL">Todos</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Nivel
              <select
                value={levelFilter}
                onChange={(event) => setLevelFilter(event.target.value)}
                className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="ALL">Todos</option>
                {levels.map((level) => (
                  <option key={level} value={level}>
                    {levelLabels[level]}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Limpiar
            </button>
          </div>

          <p className="mt-3 text-sm text-slate-500">
            Mostrando {filteredAlerts.length} de {alerts.length} alertas cargadas.
          </p>
        </>
      ) : (
        <p className="mt-5 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
          Vista de auditoria: los filtros y cambios operativos estan restringidos.
        </p>
      )}

      {state.status !== "idle" ? (
        <p
          className={`mt-4 rounded-md border px-3 py-2 text-sm ${
            state.status === "success"
              ? "border-teal-200 bg-teal-50 text-teal-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      {caseState.status !== "idle" ? (
        <p
          className={`mt-4 rounded-md border px-3 py-2 text-sm ${
            caseState.status === "success"
              ? "border-teal-200 bg-teal-50 text-teal-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {caseState.message}
        </p>
      ) : null}

      <div className="mt-5 divide-y divide-slate-100">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <article key={alert.id} className="grid gap-4 py-5 xl:grid-cols-[1.2fr_0.8fr_auto] xl:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-900">{alert.title}</p>
                  <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                    {levelLabels[alert.level] ?? alert.level}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                    {statusLabels[alert.status] ?? alert.status}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{alert.summary}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {alert.teamName ?? "Sin equipo"} &middot; {alert.createdAt}
                </p>
              </div>

              <div className="text-sm leading-6 text-slate-600">
                <p className="font-medium text-slate-800">Accion recomendada</p>
                <p className="mt-1">{alert.recommendedAction}</p>
                <p className="mt-2 text-xs text-slate-500">Abierta por: {alert.openedByName ?? "Sistema"}</p>
              </div>

              {canManage ? (
                <div className="space-y-2 xl:min-w-64">
                  <form action={formAction} className="flex gap-2 xl:justify-end">
                    <input name="alertId" type="hidden" value={alert.id} />
                    <select
                      name="status"
                      defaultValue={alert.status}
                      className="h-9 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-blue-500"
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {statusLabels[status]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="h-9 rounded-md bg-blue-600 px-3 text-xs font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Guardar
                    </button>
                  </form>

                  {alert.caseId ? (
                    <div className="flex items-center justify-end gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-medium text-teal-700">
                      <ClipboardList className="h-4 w-4" aria-hidden="true" />
                      Caso abierto: {caseStatusLabels[alert.caseStatus ?? ""] ?? alert.caseStatus}
                    </div>
                  ) : (
                    <form action={caseFormAction} className="flex xl:justify-end">
                      <input name="alertId" type="hidden" value={alert.id} />
                      <button
                        type="submit"
                        disabled={isCasePending}
                        className="inline-flex h-9 items-center gap-2 rounded-md bg-slate-900 px-3 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <ClipboardList className="h-4 w-4" aria-hidden="true" />
                        {isCasePending ? "Abriendo..." : "Abrir caso"}
                      </button>
                    </form>
                  )}
                </div>
              ) : null}
            </article>
          ))
        ) : (
          <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            {alerts.length > 0
              ? "No hay alertas que coincidan con los filtros actuales."
              : "Todavia no hay alertas para este alcance."}
          </p>
        )}
      </div>
    </section>
  );
}
