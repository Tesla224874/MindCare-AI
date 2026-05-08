import { connection } from "next/server";
import type { Metadata } from "next";
import { Bot, HeartHandshake, ShieldCheck } from "lucide-react";
import { PreventiveChat } from "@/components/ui/preventive-chat";
import { requireRoles } from "@/lib/authorization";
import { getChatOverview } from "@/lib/data/chat";
import { sendChatMessageAction, startNewChatAction } from "./actions";

export const metadata: Metadata = {
  title: "Chat preventivo - MindCare.AI",
  description: "Asistente preventivo de bienestar",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function ChatPage() {
  await connection();

  const currentUser = await requireRoles(["ADMIN", "WELLBEING", "TEAM_LEAD", "EMPLOYEE"]);
  const overview = await getChatOverview({
    id: currentUser.id,
    organizationId: currentUser.organization.id,
    teamId: currentUser.team?.id,
    role: currentUser.role,
  });

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-700">Asistente local</p>
            <h2 className="mt-1 text-xl font-semibold tracking-normal text-slate-950">
              Chat preventivo de bienestar
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Un espacio para ordenar senales tempranas, recibir orientacion no clinica y activar apoyo humano cuando
              sea necesario.
            </p>
          </div>
          <div className="flex w-fit items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
            <Bot className="h-4 w-4" aria-hidden="true" />
            Reglas + analisis
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-lg border border-teal-200 bg-teal-50 p-5 text-teal-800">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Orientacion</p>
            <HeartHandshake className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="mt-4 text-sm leading-6">Respuestas preventivas, practicas y sin diagnostico clinico.</p>
        </article>
        <article className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-800">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Escalada</p>
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="mt-4 text-sm leading-6">Alertas automaticas cuando aparecen senales elevadas.</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-5 text-slate-700">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Privacidad</p>
            <ShieldCheck className="h-5 w-5 text-teal-600" aria-hidden="true" />
          </div>
          <p className="mt-4 text-sm leading-6">Contenido minimizado, hashes y trazabilidad por auditoria.</p>
        </article>
      </section>

      <PreventiveChat
        intro={overview.intro}
        action={sendChatMessageAction}
        newChatAction={startNewChatAction}
        messages={overview.messages.map((message) => ({
          id: message.id,
          role: message.role,
          preview: message.redactedPreview,
          createdAt: formatDate(message.createdAt),
          analysis: message.analysis
            ? {
                score: message.analysis.score,
                level: message.analysis.level,
                confidence: message.analysis.confidence,
                alertId: message.analysis.alertId,
              }
            : null,
        }))}
      />
    </div>
  );
}
