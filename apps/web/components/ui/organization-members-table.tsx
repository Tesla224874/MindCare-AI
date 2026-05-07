"use client";

import { useMemo, useState } from "react";
import { RotateCcw, Search, UsersRound } from "lucide-react";

type OrganizationMember = {
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  teamName: string | null;
  isActive: boolean;
};

type OrganizationMembersTableProps = {
  members: OrganizationMember[];
};

export function OrganizationMembersTable({ members }: OrganizationMembersTableProps) {
  const [query, setQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const teams = useMemo(
    () =>
      [...new Set(members.map((member) => member.teamName ?? "Sin equipo"))].sort((a, b) => a.localeCompare(b)),
    [members],
  );
  const roles = useMemo(
    () =>
      [...new Map(members.map((member) => [member.role, member.roleLabel])).entries()].sort((a, b) =>
        a[1].localeCompare(b[1]),
      ),
    [members],
  );

  const filteredMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return members.filter((member) => {
      const teamName = member.teamName ?? "Sin equipo";
      const status = member.isActive ? "ACTIVE" : "INACTIVE";
      const searchableText = [member.name, member.email, member.roleLabel, teamName].join(" ").toLowerCase();

      return (
        (!normalizedQuery || searchableText.includes(normalizedQuery)) &&
        (teamFilter === "ALL" || teamName === teamFilter) &&
        (roleFilter === "ALL" || member.role === roleFilter) &&
        (statusFilter === "ALL" || status === statusFilter)
      );
    });
  }, [members, query, roleFilter, statusFilter, teamFilter]);

  function clearFilters() {
    setQuery("");
    setTeamFilter("ALL");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-normal">Miembros clave</h2>
          <p className="mt-1 text-sm text-slate-500">Usuarios cargados desde PostgreSQL</p>
        </div>
        <UsersRound className="h-5 w-5 text-slate-500" aria-hidden="true" />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_180px_180px_150px_auto] lg:items-end">
        <label className="block text-sm font-medium text-slate-700">
          Buscar miembro
          <span className="mt-2 flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 focus-within:border-blue-500 focus-within:bg-white">
            <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm font-normal text-slate-900 outline-none placeholder:text-slate-400"
              placeholder="Nombre, correo o rol"
            />
          </span>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Equipo
          <select
            value={teamFilter}
            onChange={(event) => setTeamFilter(event.target.value)}
            className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
          >
            <option value="ALL">Todos</option>
            {teams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Rol
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
          >
            <option value="ALL">Todos</option>
            {roles.map(([role, label]) => (
              <option key={role} value={role}>
                {label}
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
            <option value="ACTIVE">Activo</option>
            <option value="INACTIVE">Inactivo</option>
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
        Mostrando {filteredMembers.length} de {members.length} miembros registrados.
      </p>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr className="text-slate-500">
              <th className="border-b border-slate-200 py-3 pr-4 font-medium">Nombre</th>
              <th className="border-b border-slate-200 px-4 py-3 font-medium">Equipo</th>
              <th className="border-b border-slate-200 px-4 py-3 font-medium">Rol</th>
              <th className="border-b border-slate-200 px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length > 0 ? (
              filteredMembers.map((member) => (
                <tr key={member.email}>
                  <td className="border-b border-slate-100 py-4 pr-4">
                    <p className="font-medium text-slate-800">{member.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{member.email}</p>
                  </td>
                  <td className="border-b border-slate-100 px-4 py-4 text-slate-600">
                    {member.teamName ?? "Sin equipo"}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-4 text-slate-600">{member.roleLabel}</td>
                  <td className="border-b border-slate-100 px-4 py-4">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                      {member.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="border-b border-slate-100 py-4 pr-4 text-sm text-slate-500" colSpan={4}>
                  No hay miembros que coincidan con los filtros actuales.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
