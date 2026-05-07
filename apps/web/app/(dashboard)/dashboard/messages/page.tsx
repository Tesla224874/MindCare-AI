import { connection } from "next/server";
import { MessageAnalyzer } from "@/components/ui/message-analyzer";
import { requireRoles } from "@/lib/authorization";
import { getMessageLabOverview } from "@/lib/data/messages";
import { saveAnalysisAction } from "./actions";

function formatLevel(level?: string) {
  const labels: Record<string, string> = {
    LOW: "Bajo",
    OBSERVATION: "Observacion",
    PREVENTIVE_ATTENTION: "Atencion preventiva",
    HIGH: "Riesgo alto",
  };

  return level ? labels[level] ?? level : "Sin analisis";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function MessagesPage() {
  await connection();
  const currentUser = await requireRoles(["ADMIN", "WELLBEING"]);

  const overview = await getMessageLabOverview(currentUser.organization.id);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <p className="text-sm font-medium text-blue-700">Laboratorio de IA</p>
        <h2 className="mt-2 text-xl font-semibold tracking-normal text-slate-950">
          Simulador de deteccion preventiva por texto
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Esta pantalla valida el flujo antes de conectar modelos reales. El analisis usa reglas simples para explicar
          que senales se detectan y por que no deben interpretarse como diagnostico.
        </p>
        {overview ? (
          <p className="mt-3 text-sm text-slate-500">
            Guardando como: {overview.author.name} &middot; Organizacion: {overview.organization.name}
          </p>
        ) : (
          <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            No se encontro la organizacion demo. Ejecuta npm.cmd run db:seed.
          </p>
        )}
      </section>

      <MessageAnalyzer saveAction={saveAnalysisAction} />

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-normal">Analisis recientes</h2>
            <p className="mt-1 text-sm text-slate-500">
              Registros guardados en PostgreSQL con contenido minimizado
            </p>
          </div>
        </div>

        <div className="mt-5 divide-y divide-slate-100">
          {overview && overview.recentMessages.length > 0 ? (
            overview.recentMessages.map((message) => {
              const analysis = message.analyses[0];

              return (
                <div key={message.id} className="grid gap-3 py-4 md:grid-cols-[1fr_180px] md:items-center">
                  <div>
                    <p className="font-medium text-slate-800">{message.redactedPreview ?? "Mensaje minimizado"}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {message.author.name} &middot; {message.team?.name ?? "Sin equipo"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">Hash: {message.contentHash.slice(0, 18)}...</p>
                  </div>
                  <div className="md:text-right">
                    <p className="text-sm font-medium text-slate-700">{formatLevel(analysis?.level)}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {analysis ? `${analysis.score}/100 - ${analysis.confidence}%` : "Pendiente"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{formatDate(message.createdAt)}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Todavia no hay analisis guardados.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
