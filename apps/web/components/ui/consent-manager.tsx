"use client";

import { useActionState, useMemo, useState } from "react";
import { FileCheck2, RotateCcw, Search } from "lucide-react";
import type { UpdateConsentState } from "@/app/(dashboard)/dashboard/privacy/actions";

type ConsentItem = {
  id: string;
  source: string;
  status: string;
};

type ConsentUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  teamName: string | null;
  consents: ConsentItem[];
};

type ConsentManagerProps = {
  users: ConsentUser[];
  canManage: boolean;
  canFilter: boolean;
  action: (previousState: UpdateConsentState, formData: FormData) => Promise<UpdateConsentState>;
};

const initialState: UpdateConsentState = {
  status: "idle",
  message: "",
};

const sourceLabels: Record<string, string> = {
  TEXT: "Texto",
  WORKLOAD: "Rendimiento",
  FACIAL_PREMIUM: "Facial premium",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  GRANTED: "Concedido",
  REVOKED: "Revocado",
  EXPIRED: "Expirado",
};

const editableStatuses = ["PENDING", "GRANTED", "REVOKED"];
const sources = ["TEXT", "WORKLOAD", "FACIAL_PREMIUM"];
const statuses = ["PENDING", "GRANTED", "REVOKED", "EXPIRED"];

export function ConsentManager({ users, canManage, canFilter, action }: ConsentManagerProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const consentRows = useMemo(
    () =>
      users.flatMap((user) =>
        user.consents.map((consent) => ({
          user,
          consent,
        })),
      ),
    [users],
  );

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return consentRows.filter(({ user, consent }) => {
      const matchesSource = sourceFilter === "ALL" || consent.source === sourceFilter;
      const matchesStatus = statusFilter === "ALL" || consent.status === statusFilter;
      const searchableText = [user.name, user.email, user.teamName ?? "", user.role, consent.source, consent.status]
        .join(" ")
        .toLowerCase();
      const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);

      return matchesSource && matchesStatus && matchesQuery;
    });
  }, [consentRows, query, sourceFilter, statusFilter]);

  function clearFilters() {
    setQuery("");
    setSourceFilter("ALL");
    setStatusFilter("ALL");
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-normal">Matriz por usuario</h2>
          <p className="mt-1 text-sm text-slate-500">
            Estado individual de permisos por fuente de datos autorizada.
          </p>
        </div>
        <FileCheck2 className="h-5 w-5 text-slate-500" aria-hidden="true" />
      </div>

      {canFilter ? (
        <>
          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_190px_170px_auto] lg:items-end">
            <label className="block text-sm font-medium text-slate-700">
              Buscar usuario
              <span className="mt-2 flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 focus-within:border-blue-500 focus-within:bg-white">
                <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm font-normal text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="Nombre, correo o equipo"
                />
              </span>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Fuente
              <select
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value)}
                className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="ALL">Todas</option>
                {sources.map((source) => (
                  <option key={source} value={source}>
                    {sourceLabels[source]}
                  </option>
                ))}
              </select>
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
            Mostrando {filteredRows.length} de {consentRows.length} permisos registrados.
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

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[860px] border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr className="text-slate-500">
              <th className="border-b border-slate-200 py-3 pr-4 font-medium">Usuario</th>
              <th className="border-b border-slate-200 px-4 py-3 font-medium">Equipo</th>
              <th className="border-b border-slate-200 px-4 py-3 font-medium">Fuente</th>
              <th className="border-b border-slate-200 px-4 py-3 font-medium">Estado</th>
              {canManage ? <th className="border-b border-slate-200 px-4 py-3 font-medium">Cambiar</th> : null}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length > 0 ? (
              filteredRows.map(({ user, consent }) => (
                <tr key={consent.id}>
                  <td className="border-b border-slate-100 py-4 pr-4">
                    <p className="font-medium text-slate-800">{user.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{user.email}</p>
                  </td>
                  <td className="border-b border-slate-100 px-4 py-4 text-slate-600">
                    {user.teamName ?? "Sin equipo"}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-4 text-slate-600">
                    {sourceLabels[consent.source] ?? consent.source}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-4">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                      {statusLabels[consent.status] ?? consent.status}
                    </span>
                  </td>
                  {canManage ? (
                    <td className="border-b border-slate-100 px-4 py-4">
                      <form action={formAction} className="flex gap-2">
                        <input name="consentId" type="hidden" value={consent.id} />
                        <select
                          name="status"
                          defaultValue={consent.status}
                          className="h-9 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-blue-500"
                        >
                          {editableStatuses.map((status) => (
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
                    </td>
                  ) : null}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="border-b border-slate-100 py-4 pr-4 text-sm text-slate-500"
                  colSpan={canManage ? 5 : 4}
                >
                  No hay permisos que coincidan con los filtros actuales.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
