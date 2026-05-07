"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  return (
    <section className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-900">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <h2 className="text-lg font-semibold tracking-normal">No se pudo cargar esta vista</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6">
            Revisa que PostgreSQL este activo y que las variables de entorno esten configuradas.
          </p>
          {error.digest ? <p className="mt-2 text-xs opacity-70">Codigo: {error.digest}</p> : null}
          <button
            type="button"
            onClick={reset}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-rose-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-800"
          >
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            Reintentar
          </button>
        </div>
      </div>
    </section>
  );
}
