"use client";

import { useActionState, useMemo, useState } from "react";
import { ClipboardList, FileText, RotateCcw, Search, ShieldCheck } from "lucide-react";
import type { CaseActionState } from "@/app/(dashboard)/dashboard/cases/actions";

type CaseNoteItem = {
  id: string;
  body: string;
  authorName: string | null;
  createdAt: string;
};

type CaseTimelineAction = {
  id: string;
  type: string;
  description: string;
  actorName: string | null;
  createdAt: string;
  completedAt: string | null;
};

type CaseItem = {
  id: string;
  title: string;
  summary: string;
  objective: string;
  nextStep: string;
  status: string;
  priority: string;
  dueAt: string | null;
  closedAt: string | null;
  createdAt: string;
  teamName: string | null;
  ownerName: string | null;
  subjectName: string | null;
  alertTitle: string | null;
  alertLevel: string | null;
  notesCount: number;
  actionsCount: number;
  notes: CaseNoteItem[];
  actions: CaseTimelineAction[];
};

type CaseManagerProps = {
  cases: CaseItem[];
  canManage: boolean;
  canAddNotes: boolean;
  canFilter: boolean;
  updateStatusAction: (previousState: CaseActionState, formData: FormData) => Promise<CaseActionState>;
  addNoteAction: (previousState: CaseActionState, formData: FormData) => Promise<CaseActionState>;
  recordActionAction: (previousState: CaseActionState, formData: FormData) => Promise<CaseActionState>;
};

const initialState: CaseActionState = {
  status: "idle",
  message: "",
};

const statusLabels: Record<string, string> = {
  TRIAGE: "Triage",
  ACTIVE: "Activo",
  MONITORING: "Monitoreo",
  ESCALATED: "Escalado",
  CLOSED: "Cerrado",
};

const priorityLabels: Record<string, string> = {
  LOW: "Baja",
  STANDARD: "Estandar",
  HIGH: "Alta",
  URGENT: "Urgente",
};

const actionLabels: Record<string, string> = {
  HUMAN_REVIEW: "Revision humana",
  WELLBEING_CHECKIN: "Check-in bienestar",
  WORKLOAD_ADJUSTMENT: "Ajuste de carga",
  MANAGER_ALIGNMENT: "Alineacion con lider",
  CONSENT_REVIEW: "Revision de consentimiento",
  EXTERNAL_REFERRAL: "Derivacion externa",
  CASE_CLOSED: "Cierre de caso",
};

const statuses = ["TRIAGE", "ACTIVE", "MONITORING", "ESCALATED", "CLOSED"];
const priorities = ["LOW", "STANDARD", "HIGH", "URGENT"];
const actionTypes = [
  "HUMAN_REVIEW",
  "WELLBEING_CHECKIN",
  "WORKLOAD_ADJUSTMENT",
  "MANAGER_ALIGNMENT",
  "CONSENT_REVIEW",
  "EXTERNAL_REFERRAL",
  "CASE_CLOSED",
];

function getPriorityTone(priority: string) {
  if (priority === "URGENT") {
    return "bg-rose-50 text-rose-700";
  }

  if (priority === "HIGH") {
    return "bg-amber-50 text-amber-700";
  }

  if (priority === "STANDARD") {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-slate-100 text-slate-600";
}

function StateMessage({ state }: { state: CaseActionState }) {
  if (state.status === "idle") {
    return null;
  }

  return (
    <p
      className={`mt-4 rounded-md border px-3 py-2 text-sm ${
        state.status === "success"
          ? "border-teal-200 bg-teal-50 text-teal-800"
          : "border-rose-200 bg-rose-50 text-rose-800"
      }`}
    >
      {state.message}
    </p>
  );
}

export function CaseManager({
  cases,
  canManage,
  canAddNotes,
  canFilter,
  updateStatusAction,
  addNoteAction,
  recordActionAction,
}: CaseManagerProps) {
  const [statusState, statusFormAction, isStatusPending] = useActionState(updateStatusAction, initialState);
  const [noteState, noteFormAction, isNotePending] = useActionState(addNoteAction, initialState);
  const [recordState, recordFormAction, isRecordPending] = useActionState(recordActionAction, initialState);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  const filteredCases = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return cases.filter((item) => {
      const searchableText = [
        item.title,
        item.summary,
        item.objective,
        item.nextStep,
        item.teamName ?? "",
        item.ownerName ?? "",
        item.alertTitle ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!normalizedQuery || searchableText.includes(normalizedQuery)) &&
        (statusFilter === "ALL" || item.status === statusFilter) &&
        (priorityFilter === "ALL" || item.priority === priorityFilter)
      );
    });
  }, [cases, priorityFilter, query, statusFilter]);

  function clearFilters() {
    setQuery("");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-normal">Bandeja de casos</h2>
          <p className="mt-1 text-sm text-slate-500">Seguimiento humano, notas y acciones preventivas.</p>
        </div>
        <ClipboardList className="h-5 w-5 text-slate-500" aria-hidden="true" />
      </div>

      {canFilter ? (
        <>
          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_180px_180px_auto] lg:items-end">
            <label className="block text-sm font-medium text-slate-700">
              Buscar caso
              <span className="mt-2 flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 focus-within:border-blue-500 focus-within:bg-white">
                <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm font-normal text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="Titulo, equipo o siguiente paso"
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
              Prioridad
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
                className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="ALL">Todas</option>
                {priorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priorityLabels[priority]}
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
            Mostrando {filteredCases.length} de {cases.length} casos cargados.
          </p>
        </>
      ) : (
        <p className="mt-5 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
          Vista de auditoria: los filtros y acciones operativas estan restringidos.
        </p>
      )}

      <StateMessage state={statusState} />
      <StateMessage state={noteState} />
      <StateMessage state={recordState} />

      <div className="mt-5 space-y-4">
        {filteredCases.length > 0 ? (
          filteredCases.map((item) => (
            <article key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold tracking-normal text-slate-900">{item.title}</h3>
                    <span className="rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-600">
                      {statusLabels[item.status] ?? item.status}
                    </span>
                    <span className={`rounded-md px-2 py-1 text-xs font-medium ${getPriorityTone(item.priority)}`}>
                      {priorityLabels[item.priority] ?? item.priority}
                    </span>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    <span className="font-medium text-slate-800">Objetivo:</span> {item.objective}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    <span className="font-medium text-slate-800">Siguiente paso:</span> {item.nextStep}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="rounded-md bg-white px-2 py-1">{item.teamName ?? "Sin equipo"}</span>
                    <span className="rounded-md bg-white px-2 py-1">Responsable: {item.ownerName ?? "Sin asignar"}</span>
                    <span className="rounded-md bg-white px-2 py-1">Vence: {item.dueAt ?? "Sin fecha"}</span>
                    <span className="rounded-md bg-white px-2 py-1">
                      {item.notesCount} notas / {item.actionsCount} acciones
                    </span>
                  </div>

                  {item.alertTitle ? (
                    <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      Origen: {item.alertTitle} {item.alertLevel ? `(${item.alertLevel})` : ""}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                      <FileText className="h-4 w-4 text-blue-600" aria-hidden="true" />
                      Notas recientes
                    </div>
                    <div className="mt-3 space-y-2">
                      {item.notes.length > 0 ? (
                        item.notes.map((note) => (
                          <div key={note.id} className="rounded-md bg-slate-50 p-3">
                            <p className="text-sm leading-6 text-slate-600">{note.body}</p>
                            <p className="mt-1 text-xs text-slate-400">
                              {note.authorName ?? "Sistema"} &middot; {note.createdAt}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">Sin notas registradas.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                      <ShieldCheck className="h-4 w-4 text-teal-600" aria-hidden="true" />
                      Acciones recientes
                    </div>
                    <div className="mt-3 space-y-2">
                      {item.actions.length > 0 ? (
                        item.actions.map((action) => (
                          <div key={action.id} className="rounded-md bg-slate-50 p-3">
                            <p className="text-xs font-medium text-slate-500">
                              {actionLabels[action.type] ?? action.type}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-slate-600">{action.description}</p>
                            <p className="mt-1 text-xs text-slate-400">
                              {action.actorName ?? "Sistema"} &middot; {action.completedAt ?? action.createdAt}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">Sin acciones registradas.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4 xl:grid-cols-3">
                {canManage ? (
                  <form action={statusFormAction} className="rounded-lg border border-slate-200 bg-white p-4">
                    <input name="caseId" type="hidden" value={item.id} />
                    <label className="block text-sm font-medium text-slate-700">
                      Cambiar estado
                      <select
                        name="status"
                        defaultValue={item.status}
                        className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {statusLabels[status]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="mt-3 block text-sm font-medium text-slate-700">
                      Siguiente paso
                      <textarea
                        name="nextStep"
                        defaultValue={item.nextStep}
                        className="mt-2 min-h-20 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={isStatusPending}
                      className="mt-3 h-10 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isStatusPending ? "Guardando..." : "Guardar estado"}
                    </button>
                  </form>
                ) : null}

                {canAddNotes ? (
                  <form action={noteFormAction} className="rounded-lg border border-slate-200 bg-white p-4">
                    <input name="caseId" type="hidden" value={item.id} />
                    <label className="block text-sm font-medium text-slate-700">
                      Agregar nota
                      <textarea
                        name="body"
                        required
                        minLength={12}
                        className="mt-2 min-h-32 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                        placeholder="Registra contexto o decision humana..."
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={isNotePending}
                      className="mt-3 h-10 rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isNotePending ? "Registrando..." : "Registrar nota"}
                    </button>
                  </form>
                ) : null}

                {canManage ? (
                  <form action={recordFormAction} className="rounded-lg border border-slate-200 bg-white p-4">
                    <input name="caseId" type="hidden" value={item.id} />
                    <label className="block text-sm font-medium text-slate-700">
                      Tipo de accion
                      <select
                        name="type"
                        defaultValue="WELLBEING_CHECKIN"
                        className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                      >
                        {actionTypes.map((type) => (
                          <option key={type} value={type}>
                            {actionLabels[type]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="mt-3 block text-sm font-medium text-slate-700">
                      Descripcion
                      <textarea
                        name="description"
                        required
                        minLength={12}
                        className="mt-2 min-h-20 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                        placeholder="Describe la accion realizada..."
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={isRecordPending}
                      className="mt-3 h-10 rounded-md bg-teal-600 px-4 text-sm font-medium text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isRecordPending ? "Registrando..." : "Registrar accion"}
                    </button>
                  </form>
                ) : null}
              </div>
            </article>
          ))
        ) : (
          <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            {cases.length > 0
              ? "No hay casos que coincidan con los filtros actuales."
              : "Todavia no hay casos preventivos abiertos."}
          </p>
        )}
      </div>
    </section>
  );
}
