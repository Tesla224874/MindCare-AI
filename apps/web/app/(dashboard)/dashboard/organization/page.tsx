import { connection } from "next/server";
import {
  Building2,
  CheckCircle2,
  CircleAlert,
  Crown,
  Database,
  KeyRound,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { TeamCreateForm } from "@/components/ui/team-create-form";
import { UserCreateForm } from "@/components/ui/user-create-form";
import { requireRoles } from "@/lib/authorization";
import { getOrganizationOverview } from "@/lib/data/organization";
import { createTeamAction, createUserAction } from "./actions";

type ConsentStat = {
  status: string;
  _count: {
    status: number;
  };
};

const policies = [
  "Consentimiento explicito antes de analizar mensajes.",
  "Reportes ejecutivos por equipo, no por diagnostico individual.",
  "Acceso sensible registrado en auditoria.",
  "Alertas preventivas derivadas a apoyo humano.",
];

const roleDescriptions = {
  ADMIN: {
    role: "Administrador",
    access: "Gestiona equipos, miembros y configuracion general.",
    boundary: "No accede a contenido privado individual sin protocolo.",
  },
  WELLBEING: {
    role: "Bienestar / RR.HH.",
    access: "Revisa alertas agregadas y coordina acciones de apoyo.",
    boundary: "No debe usar senales preventivas para sanciones laborales.",
  },
  TEAM_LEAD: {
    role: "Lider de equipo",
    access: "Consulta tendencias agregadas de su area.",
    boundary: "No ve mensajes, diagnosticos ni perfiles clinicos.",
  },
  AUDITOR: {
    role: "Auditor",
    access: "Revisa trazabilidad, consentimientos y accesos sensibles.",
    boundary: "No gestiona intervenciones ni equipos.",
  },
  EMPLOYEE: {
    role: "Colaborador",
    access: "Consulta su propia experiencia y consentimientos.",
    boundary: "No accede a reportes organizacionales.",
  },
};

function getConsentCoverage(consentStats: ConsentStat[], userCount: number) {
  const granted = consentStats
    .filter((item) => item.status === "GRANTED")
    .reduce((total, item) => total + item._count.status, 0);
  const expectedConsentRows = Math.max(userCount * 2, 1);

  return Math.round((granted / expectedConsentRows) * 100);
}

function getTeamWellbeing(team: { _count: { members: number; alerts: number } }) {
  return Math.max(48, Math.min(94, 86 - team._count.alerts * 12 + Math.min(team._count.members, 10)));
}

function getTeamStatus(alerts: number) {
  if (alerts >= 2) {
    return "Atencion moderada";
  }

  if (alerts === 1) {
    return "Seguimiento";
  }

  return "Estable";
}

function getRoleLabel(role: keyof typeof roleDescriptions) {
  return roleDescriptions[role]?.role ?? role;
}

export default async function OrganizationPage() {
  await connection();
  const currentUser = await requireRoles(["ADMIN", "WELLBEING"]);

  const overview = await getOrganizationOverview(currentUser.organization.id);

  if (!overview) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-900">
        <p className="font-medium">No se encontro la organizacion demo.</p>
        <p className="mt-2 text-sm">Ejecuta npm.cmd run db:seed para cargar datos iniciales.</p>
      </div>
    );
  }

  const { organization, consentStats } = overview;
  const consentCoverage = getConsentCoverage(consentStats, organization._count.users);
  const activeUsers = organization.users.filter((user) => user.isActive).length;
  const visibleRoles = Object.entries(roleDescriptions).filter(([role]) =>
    organization.users.some((user) => user.role === role),
  );

  const organizationMetrics = [
    {
      label: "Miembros registrados",
      value: String(organization._count.users),
      detail: `${activeUsers} activos en ${organization.name}`,
      icon: UsersRound,
      tone: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      label: "Equipos monitoreados",
      value: String(organization._count.teams),
      detail: "Reportes agregados",
      icon: Building2,
      tone: "bg-slate-50 text-slate-700 border-slate-200",
    },
    {
      label: "Consentimientos",
      value: `${consentCoverage}%`,
      detail: "Cobertura de fuentes base",
      icon: UserRoundCheck,
      tone: "bg-teal-50 text-teal-700 border-teal-200",
    },
    {
      label: "Accesos auditados",
      value: String(organization._count.auditLogs),
      detail: "Eventos registrados",
      icon: KeyRound,
      tone: "bg-amber-50 text-amber-700 border-amber-200",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-700">Datos desde PostgreSQL</p>
            <h2 className="mt-1 text-xl font-semibold tracking-normal text-slate-950">{organization.name}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Industria: {organization.industry ?? "No definida"} &middot; Facial premium:{" "}
              {organization.premiumFacial ? "Activo" : "Inactivo"}
            </p>
          </div>
          <div className="flex w-fit items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-700">
            <Database className="h-4 w-4" aria-hidden="true" />
            Prisma conectado
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {organizationMetrics.map((metric) => {
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

      <TeamCreateForm action={createTeamAction} />
      <UserCreateForm
        action={createUserAction}
        teams={organization.teams.map((team) => ({
          id: team.id,
          name: team.name,
        }))}
      />

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-normal">Equipos</h2>
              <p className="mt-1 text-sm text-slate-500">Vista agregada por area de trabajo</p>
            </div>
            <Building2 className="h-5 w-5 text-slate-500" aria-hidden="true" />
          </div>

          <div className="mt-5 divide-y divide-slate-100">
            {organization.teams.map((team) => {
              const wellbeing = getTeamWellbeing(team);

              return (
                <div key={team.id} className="grid gap-4 py-4 md:grid-cols-[1fr_160px] md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-800">{team.name}</p>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
                        {team._count.members} miembros
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
                        {team._count.alerts} alertas
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {team.description ?? "Equipo sincronizado desde la base de datos."}
                    </p>
                    <div className="mt-3 h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-blue-500" style={{ width: `${wellbeing}%` }} />
                    </div>
                  </div>
                  <div className="md:text-right">
                    <p className="text-2xl font-semibold tracking-normal text-slate-900">{wellbeing}</p>
                    <p className="text-sm text-slate-500">{getTeamStatus(team._count.alerts)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-normal">Politicas activas</h2>
              <p className="mt-1 text-sm text-slate-500">Base de privacidad para el MVP</p>
            </div>
            <ShieldCheck className="h-5 w-5 text-teal-600" aria-hidden="true" />
          </div>

          <div className="mt-5 space-y-3">
            {policies.map((policy) => (
              <div key={policy} className="flex gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
                <p className="text-sm leading-6 text-slate-600">{policy}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-800">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CircleAlert className="h-4 w-4" aria-hidden="true" />
              Regla de producto
            </div>
            <p className="mt-2 text-sm leading-6">
              La empresa debe ver tendencias y riesgos agregados, no etiquetas clinicas sobre personas.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-normal">Miembros clave</h2>
            <p className="mt-1 text-sm text-slate-500">Usuarios cargados desde PostgreSQL</p>
          </div>
          <UsersRound className="h-5 w-5 text-slate-500" aria-hidden="true" />
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr className="text-slate-500">
                <th className="border-b border-slate-200 py-3 pr-4 font-medium">Nombre</th>
                <th className="border-b border-slate-200 px-4 py-3 font-medium">Equipo</th>
                <th className="border-b border-slate-200 px-4 py-3 font-medium">Rol</th>
                <th className="border-b border-slate-200 px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {organization.users.map((member) => (
                <tr key={member.email}>
                  <td className="border-b border-slate-100 py-4 pr-4">
                    <p className="font-medium text-slate-800">{member.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{member.email}</p>
                  </td>
                  <td className="border-b border-slate-100 px-4 py-4 text-slate-600">
                    {member.team?.name ?? "Sin equipo"}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-4 text-slate-600">{getRoleLabel(member.role)}</td>
                  <td className="border-b border-slate-100 px-4 py-4">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                      {member.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-normal">Matriz de roles</h2>
            <p className="mt-1 text-sm text-slate-500">Permisos activos segun usuarios cargados</p>
          </div>
          <Crown className="h-5 w-5 text-slate-500" aria-hidden="true" />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {visibleRoles.map(([role, description]) => (
            <article key={role} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="font-medium text-slate-800">{description.role}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description.access}</p>
              <p className="mt-3 text-sm leading-6 text-slate-500">{description.boundary}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
