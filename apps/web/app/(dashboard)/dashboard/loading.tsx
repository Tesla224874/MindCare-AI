const metricPlaceholders = ["Bienestar", "Alertas", "Riesgo", "Usuarios"];

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
        <div className="mt-3 h-7 w-72 max-w-full animate-pulse rounded bg-slate-100" />
        <div className="mt-3 h-4 w-full max-w-2xl animate-pulse rounded bg-slate-100" />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricPlaceholders.map((item) => (
          <article key={item} className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
              <div className="h-5 w-5 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="mt-5 h-8 w-16 animate-pulse rounded bg-slate-100" />
            <div className="mt-2 h-4 w-32 animate-pulse rounded bg-slate-100" />
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="h-5 w-48 animate-pulse rounded bg-slate-100" />
          <div className="mt-6 space-y-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item}>
                <div className="mb-2 h-4 w-40 animate-pulse rounded bg-slate-100" />
                <div className="h-2 animate-pulse rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="h-5 w-36 animate-pulse rounded bg-slate-100" />
          <div className="mt-5 space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-4 animate-pulse rounded bg-slate-100" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
