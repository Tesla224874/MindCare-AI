import { connection } from "next/server";
import { AlertTriangle, CheckCircle2, ClipboardList, Clock, ShieldCheck } from "lucide-react";
import { CaseManager } from "@/components/ui/case-manager";
import { requireRoles } from "@/lib/authorization";
import { getCasesOverview } from "@/lib/data/cases";
import { addCaseNoteAction, recordCaseActionAction, updateCaseStatusAction } from "./actions";

function getScope(user: Awaited<ReturnType<typeof requireRoles>>) {
  return {
    organizationId: user.organization.id,
    teamId: null,
    label: user.organization.name,
  };
}

function formatDate(date?: Date | null) {
  if (!date) {
    return null;
  }

  return new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function CasesPage() {
  await connection();

  const currentUser = await requireRoles(["ADMIN", "WELLBEING", "AUDITOR"]);
  const scope = getScope(currentUser);
  const overview = await getCasesOverview(scope);
  const canManageCases = currentUser.role === "ADMIN" || currentUser.role === "WELLBEING";
  const canAddNotes = canManageCases || currentUser.role === "AUDITOR";

  const activeCases = overview.counts.TRIAGE + overview.counts.ACTIVE + overview.counts.MONITORING;
  const metrics = [
    {
      label: "Casos activos",
      value: String(activeCases),
      detail: "Requieren seguimiento",
      icon: ClipboardList,
      tone: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      label: "Escalados",
      value: String(overview.counts.ESCALATED),
      detail: "Necesitan protocolo superior",
      icon: AlertTriangle,
      tone: "bg-rose-50 text-rose-700 border-rose-200",
    },
    {
      label: "Vencidos",
      value: String(overview.overdueCount),
      detail: "Con siguiente paso atrasado",
      icon: Clock,
      tone: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      label: "Cerrados",
      value: String(overview.counts.CLOSED),
      detail: "Con trazabilidad",
      icon: CheckCircle2,
      tone: "bg-teal-50 text-teal-700 border-teal-200",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-700">Seguimiento humano</p>
            <h2 className="mt-1 text-xl font-semibold tracking-normal text-slate-950">
              Casos preventivos de {scope.label}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Un caso preventivo convierte una alerta en un flujo de apoyo con responsable, siguiente paso, notas y
              acciones auditables.
            </p>
          </div>
          <div className="flex w-fit items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-700">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Sin diagnostico clinico
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
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

      <CaseManager
        canManage={canManageCases}
        canAddNotes={canAddNotes}
        canFilter={canManageCases}
        updateStatusAction={updateCaseStatusAction}
        addNoteAction={addCaseNoteAction}
        recordActionAction={recordCaseActionAction}
        cases={overview.cases.map((item) => ({
          id: item.id,
          title: item.title,
          summary: item.summary,
          objective: item.objective,
          nextStep: item.nextStep,
          status: item.status,
          priority: item.priority,
          dueAt: formatDate(item.dueAt),
          closedAt: formatDate(item.closedAt),
          createdAt: formatDate(item.createdAt) ?? "",
          teamName: item.team?.name ?? null,
          ownerName: item.owner?.name ?? null,
          subjectName: item.subjectUser?.name ?? null,
          alertTitle: item.alert?.title ?? null,
          alertLevel: item.alert?.level ?? null,
          notesCount: item._count.notes,
          actionsCount: item._count.actions,
          notes: item.notes.map((note) => ({
            id: note.id,
            body: note.body,
            authorName: note.author?.name ?? null,
            createdAt: formatDate(note.createdAt) ?? "",
          })),
          actions: item.actions.map((action) => ({
            id: action.id,
            type: action.type,
            description: action.description,
            actorName: action.actor?.name ?? null,
            createdAt: formatDate(action.createdAt) ?? "",
            completedAt: formatDate(action.completedAt),
          })),
        }))}
      />
    </div>
  );
}
