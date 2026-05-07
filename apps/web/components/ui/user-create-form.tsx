"use client";

import { useActionState } from "react";
import { UserPlus } from "lucide-react";
import type { CreateUserState } from "@/app/(dashboard)/dashboard/organization/actions";
import { roleLabels, type AppRole } from "@/lib/permissions";

type TeamOption = {
  id: string;
  name: string;
};

type UserCreateFormProps = {
  teams: TeamOption[];
  action: (previousState: CreateUserState, formData: FormData) => Promise<CreateUserState>;
};

const initialState: CreateUserState = {
  status: "idle",
  message: "",
};

const roles: AppRole[] = ["EMPLOYEE", "TEAM_LEAD", "WELLBEING", "AUDITOR", "ADMIN"];

export function UserCreateForm({ teams, action }: UserCreateFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-normal">Crear usuario</h2>
          <p className="mt-1 text-sm text-slate-500">Agrega una cuenta con rol, equipo y contrasena temporal.</p>
        </div>
        <UserPlus className="h-5 w-5 text-slate-500" aria-hidden="true" />
      </div>

      <form action={formAction} className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="user-name">
            Nombre
          </label>
          <input
            id="user-name"
            name="name"
            className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white"
            placeholder="Ej. Paula Gomez"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="user-email">
            Correo corporativo
          </label>
          <input
            id="user-email"
            name="email"
            type="email"
            autoComplete="email"
            className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white"
            placeholder="paula@empresa.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="user-role">
            Rol
          </label>
          <select
            id="user-role"
            name="role"
            defaultValue="EMPLOYEE"
            className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {roleLabels[role]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="user-team">
            Equipo
          </label>
          <select
            id="user-team"
            name="teamId"
            className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
          >
            <option value="">Sin equipo</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="user-password">
            Contrasena temporal
          </label>
          <input
            id="user-password"
            name="password"
            type="password"
            autoComplete="new-password"
            className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white"
            placeholder="Minimo 8 caracteres"
            required
          />
        </div>

        <div className="lg:col-span-2">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            {isPending ? "Creando..." : "Crear usuario"}
          </button>
        </div>
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
