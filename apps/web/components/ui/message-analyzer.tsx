"use client";

import { useActionState, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Database, MessageSquareText, ShieldCheck } from "lucide-react";
import { analyzeMessage } from "@/lib/analysis";
import type { SaveAnalysisState } from "@/app/(dashboard)/dashboard/messages/actions";

const sampleMessage =
  "Estoy agotado, siento demasiada presion y no duermo bien. No quiero molestar al equipo, pero no puedo mas.";

const levelStyles = {
  Bajo: "border-teal-200 bg-teal-50 text-teal-800",
  Observacion: "border-sky-200 bg-sky-50 text-sky-800",
  "Atencion preventiva": "border-amber-200 bg-amber-50 text-amber-800",
  "Riesgo alto": "border-rose-200 bg-rose-50 text-rose-800",
};

type MessageAnalyzerProps = {
  saveAction: (previousState: SaveAnalysisState, formData: FormData) => Promise<SaveAnalysisState>;
};

const initialSaveState: SaveAnalysisState = {
  status: "idle",
  message: "",
};

export function MessageAnalyzer({ saveAction }: MessageAnalyzerProps) {
  const [message, setMessage] = useState(sampleMessage);
  const [saveState, formAction, isPending] = useActionState(saveAction, initialSaveState);
  const analysis = useMemo(() => analyzeMessage(message), [message]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-normal">Mensaje de prueba</h2>
            <p className="mt-1 text-sm text-slate-500">
              Simula un mensaje interno para detectar senales preventivas.
            </p>
          </div>
          <MessageSquareText className="h-5 w-5 text-slate-500" aria-hidden="true" />
        </div>

        <form action={formAction}>
          <label className="mt-5 block text-sm font-medium text-slate-700" htmlFor="message-analysis">
            Texto a analizar
          </label>
          <textarea
            id="message-analysis"
            name="message"
            className="mt-2 min-h-56 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Escribe aqui un mensaje de ejemplo..."
          />

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending}
            >
              <Database className="h-4 w-4" aria-hidden="true" />
              {isPending ? "Guardando..." : "Guardar analisis"}
            </button>
            <button
              type="button"
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              onClick={() => setMessage(sampleMessage)}
            >
              Cargar ejemplo
            </button>
            <button
              type="button"
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              onClick={() => setMessage("")}
            >
              Limpiar
            </button>
          </div>

          {saveState.status !== "idle" ? (
            <p
              className={`mt-4 rounded-md border px-3 py-2 text-sm ${
                saveState.status === "success"
                  ? "border-teal-200 bg-teal-50 text-teal-800"
                  : "border-rose-200 bg-rose-50 text-rose-800"
              }`}
            >
              {saveState.message}
            </p>
          ) : null}
        </form>
      </section>

      <section className="space-y-4">
        <div className={`rounded-lg border p-5 ${levelStyles[analysis.level]}`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium opacity-80">Nivel preventivo</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-normal">{analysis.level}</h2>
            </div>
            {analysis.score >= 45 ? (
              <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            )}
          </div>
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>Puntaje de senal</span>
              <span>{analysis.score}/100</span>
            </div>
            <div className="h-2 rounded-full bg-white/70">
              <div className="h-2 rounded-full bg-current" style={{ width: `${analysis.score}%` }} />
            </div>
          </div>
          <p className="mt-4 text-sm opacity-80">Confianza de lectura: {analysis.confidence}%</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-normal">Senales detectadas</h2>
              <p className="mt-1 text-sm text-slate-500">{analysis.totalMatches} coincidencias encontradas</p>
            </div>
            <ShieldCheck className="h-5 w-5 text-teal-600" aria-hidden="true" />
          </div>

          <div className="mt-5 space-y-3">
            {analysis.signals.length > 0 ? (
              analysis.signals.map((signal) => (
                <div key={signal.id} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-slate-800">{signal.label}</p>
                    <span className="rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-500">
                      {signal.kind === "risk" ? "Riesgo" : "Proteccion"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{signal.recommendation}</p>
                  <p className="mt-2 text-xs text-slate-500">Terminos: {signal.matches.join(", ")}</p>
                </div>
              ))
            ) : (
              <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No hay senales relevantes en el texto actual.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-800">Limite etico del MVP</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">{analysis.disclaimer}</p>
          <p className="mt-2 text-xs text-slate-400">Motor activo: {analysis.modelName}</p>
        </div>
      </section>
    </div>
  );
}
