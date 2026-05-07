import { connection } from "next/server";
import {
  CheckCircle2,
  CircleAlert,
  Clock,
  Database,
  EyeOff,
  FileText,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { ConsentManager } from "@/components/ui/consent-manager";
import { requireRoles } from "@/lib/authorization";
import { getPrivacyOverview } from "@/lib/data/privacy";
import { updateConsentAction } from "./actions";

type ConsentStat = {
  source: string;
  status: string;
  _count: {
    _all: number;
  };
};

const sourceContent = {
  TEXT: {
    title: "Analisis de texto laboral",
    description: "Permite extraer senales agregadas desde mensajes internos autorizados.",
  },
  WORKLOAD: {
    title: "Rendimiento y carga de trabajo",
    description: "Usa datos operativos para detectar sobrecarga y cambios sostenidos.",
  },
  FACIAL_PREMIUM: {
    title: "Rasgos faciales premium",
    description: "Solo debe habilitarse con consentimiento explicito y tecnologia certificada.",
  },
};

const dataFlow = [
  {
    step: "1. Ingestion",
    description: "Mensajes y senales laborales autorizadas entran al sistema.",
  },
  {
    step: "2. Minimizacion",
    description: "Se descartan datos innecesarios antes del analisis preventivo.",
  },
  {
    step: "3. Analisis",
    description: "El sistema calcula senales agregadas y evita diagnosticos clinicos.",
  },
  {
    step: "4. Reporte",
    description: "La organizacion ve tendencias por equipo y alertas de apoyo.",
  },
];

const safeguards = [
  "No mostrar diagnosticos clinicos a empleadores.",
  "No usar alertas preventivas para sanciones o despidos.",
  "Registrar accesos a datos sensibles.",
  "Separar datos entre organizaciones.",
  "Permitir revocacion de consentimiento.",
  "Derivar alertas graves a protocolo humano.",
];

function getGrantedCount(consents: ConsentStat[]) {
  return consents
    .filter((item) => item.status === "GRANTED")
    .reduce((total, item) => total + item._count._all, 0);
}

function getConsentCoverage(consents: ConsentStat[], userCount: number) {
  const expectedConsentRows = Math.max(userCount * 2, 1);
  return Math.round((getGrantedCount(consents) / expectedConsentRows) * 100);
}

function getSourceCount(consents: ConsentStat[], source: string, status?: string) {
  return consents
    .filter((item) => item.source === source && (!status || item.status === status))
    .reduce((total, item) => total + item._count._all, 0);
}

function getSourceStatus(granted: number, expectedUsers: number) {
  if (granted === 0) {
    return "Desactivado";
  }

  if (granted >= expectedUsers) {
    return "Activo";
  }

  return "Parcial";
}

function formatRole(role?: string) {
  const labels: Record<string, string> = {
    ADMIN: "Administrador",
    WELLBEING: "Bienestar / RR.HH.",
    TEAM_LEAD: "Lider de equipo",
    AUDITOR: "Auditor",
    EMPLOYEE: "Colaborador",
  };

  return role ? labels[role] ?? role : "Sistema";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function PrivacyPage() {
  await connection();
  const currentUser = await requireRoles(["ADMIN", "WELLBEING", "AUDITOR"]);

  const overview = await getPrivacyOverview(currentUser.organization.id);

  if (!overview) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-900">
        <p className="font-medium">No se encontro la organizacion demo.</p>
        <p className="mt-2 text-sm">Ejecuta npm.cmd run db:seed para cargar datos iniciales.</p>
      </div>
    );
  }

  const { consents, users, auditLogs, organization } = overview;
  const canManageConsents = currentUser.role === "ADMIN" || currentUser.role === "WELLBEING";
  const canFilterConsents = canManageConsents;
  const consentCoverage = getConsentCoverage(consents, organization._count.users);
  const grantedCount = getGrantedCount(consents);
  const sourceEntries = Object.entries(sourceContent).map(([source, content]) => {
    const granted = getSourceCount(consents, source, "GRANTED");
    const revoked = getSourceCount(consents, source, "REVOKED");

    return {
      source,
      ...content,
      granted,
      revoked,
      status: getSourceStatus(granted, organization._count.users),
    };
  });

  const privacyMetrics = [
    {
      label: "Consentimiento activo",
      value: `${consentCoverage}%`,
      detail: `${grantedCount} permisos concedidos`,
      icon: UserRoundCheck,
      tone: "bg-teal-50 text-teal-700 border-teal-200",
    },
    {
      label: "Datos anonimizados",
      value: "100%",
      detail: "Reportes agregados",
      icon: EyeOff,
      tone: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      label: "Retencion definida",
      value: "180d",
      detail: "Politica demo",
      icon: Clock,
      tone: "bg-slate-50 text-slate-700 border-slate-200",
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
            <h2 className="mt-1 text-xl font-semibold tracking-normal text-slate-950">
              Privacidad de {organization.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Facial premium: {organization.premiumFacial ? "Activo" : "Inactivo"} &middot; Usuarios:{" "}
              {organization._count.users}
            </p>
          </div>
          <div className="flex w-fit items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-700">
            <Database className="h-4 w-4" aria-hidden="true" />
            Prisma conectado
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {privacyMetrics.map((metric) => {
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

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-normal">Consentimientos</h2>
              <p className="mt-1 text-sm text-slate-500">Permisos cargados desde la base de datos</p>
            </div>
            <FileText className="h-5 w-5 text-slate-500" aria-hidden="true" />
          </div>

          <div className="mt-5 space-y-3">
            {sourceEntries.map((item) => (
              <article key={item.source} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-slate-800">{item.title}</p>
                  <span className="rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-600">
                    {item.status}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Concedidos: {item.granted} &middot; Revocados: {item.revoked}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-normal">Flujo de datos</h2>
              <p className="mt-1 text-sm text-slate-500">Ruta esperada antes de conectar datos reales</p>
            </div>
            <Database className="h-5 w-5 text-slate-500" aria-hidden="true" />
          </div>

          <div className="mt-5 space-y-3">
            {dataFlow.map((item) => (
              <div key={item.step} className="flex gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-600 text-xs font-semibold text-white">
                  {item.step.slice(0, 1)}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.step}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ConsentManager
        action={updateConsentAction}
        canManage={canManageConsents}
        canFilter={canFilterConsents}
        users={users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          teamName: user.team?.name ?? null,
          consents: user.consents.map((consent) => ({
            id: consent.id,
            source: consent.source,
            status: consent.status,
          })),
        }))}
      />

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-normal">Barreras de seguridad</h2>
              <p className="mt-1 text-sm text-slate-500">Condiciones minimas para operar el producto</p>
            </div>
            <ShieldCheck className="h-5 w-5 text-teal-600" aria-hidden="true" />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {safeguards.map((item) => (
              <div key={item} className="flex gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
                <p className="text-sm leading-6 text-slate-600">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-md border border-rose-200 bg-rose-50 p-4 text-rose-800">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CircleAlert className="h-4 w-4" aria-hidden="true" />
              Limite no negociable
            </div>
            <p className="mt-2 text-sm leading-6">
              MindCare.AI debe prevenir riesgos y orientar apoyo, no clasificar clinicamente a empleados para la
              empresa.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-normal">Auditoria de accesos</h2>
              <p className="mt-1 text-sm text-slate-500">Trazabilidad real de permisos sensibles</p>
            </div>
            <LockKeyhole className="h-5 w-5 text-slate-500" aria-hidden="true" />
          </div>

          <div className="mt-5 divide-y divide-slate-100">
            {auditLogs.length > 0 ? (
              auditLogs.map((log) => (
                <div key={log.id} className="grid gap-3 py-4 md:grid-cols-[1fr_180px] md:items-center">
                  <div>
                    <p className="font-medium text-slate-800">{log.user?.name ?? "Sistema"}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{log.action}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {log.entityType}
                      {log.entityId ? ` - ${log.entityId}` : ""}
                    </p>
                  </div>
                  <div className="md:text-right">
                    <p className="text-sm font-medium text-slate-700">{formatRole(log.user?.role)}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(log.createdAt)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Todavia no hay eventos de auditoria.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
