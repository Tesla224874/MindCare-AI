"use client";

import { useActionState } from "react";
import { FileCheck2 } from "lucide-react";
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

export function ConsentManager({ users, canManage, action }: ConsentManagerProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

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
            {users.flatMap((user) =>
              user.consents.map((consent) => (
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
              )),
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
