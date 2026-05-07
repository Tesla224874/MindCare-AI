"use client";

import { useActionState } from "react";
import { Building2, Plus } from "lucide-react";
import type { CreateTeamState } from "@/app/(dashboard)/dashboard/organization/actions";

type TeamCreateFormProps = {
  action: (previousState: CreateTeamState, formData: FormData) => Promise<CreateTeamState>;
};

const initialState: CreateTeamState = {
  status: "idle",
  message: "",
};

export function TeamCreateForm({ action }: TeamCreateFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-normal">Crear equipo</h2>
          <p className="mt-1 text-sm text-slate-500">Agrega una nueva area para reportes agregados.</p>
        </div>
        <Building2 className="h-5 w-5 text-slate-500" aria-hidden="true" />
      </div>

      <form action={formAction} className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.4fr_auto] lg:items-end">
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="team-name">
            Nombre del equipo
          </label>
          <input
            id="team-name"
            name="name"
            className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white"
            placeholder="Ej. Finanzas"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="team-description">
            Descripcion
          </label>
          <input
            id="team-description"
            name="description"
            className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white"
            placeholder="Contexto operativo del equipo"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {isPending ? "Creando..." : "Crear"}
        </button>
      </form>

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
    </section>
  );
}
