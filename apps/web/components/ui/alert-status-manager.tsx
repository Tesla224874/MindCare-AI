"use client";

import { useActionState } from "react";
import { AlertTriangle } from "lucide-react";
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
};

type AlertStatusManagerProps = {
  alerts: AlertItem[];
  canManage: boolean;
  action: (previousState: UpdateAlertState, formData: FormData) => Promise<UpdateAlertState>;
};

const initialState: UpdateAlertState = {
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

const statuses = ["OPEN", "IN_REVIEW", "RESOLVED", "DISMISSED"];

export function AlertStatusManager({ alerts, canManage, action }: AlertStatusManagerProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-normal">Alertas preventivas</h2>
          <p className="mt-1 text-sm text-slate-500">Revision humana de alertas generadas por el sistema.</p>
        </div>
        <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />
      </div>

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

      <div className="mt-5 divide-y divide-slate-100">
        {alerts.length > 0 ? (
          alerts.map((alert) => (
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
              ) : null}
            </article>
          ))
        ) : (
          <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            Todavia no hay alertas para este alcance.
          </p>
        )}
      </div>
    </section>
  );
}
