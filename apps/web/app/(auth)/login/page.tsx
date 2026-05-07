import { BrainCircuit } from "lucide-react";
import { loginAction } from "./actions";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/auth";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const hasInvalidCredentials = params?.error === "invalid";
  const isRateLimited = params?.error === "rate-limit";
  const showDemoCredentials = process.env.NODE_ENV !== "production";
  const nextPath = params?.next?.startsWith("/dashboard") ? params.next : "/dashboard";

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500 mb-4">
            <BrainCircuit className="h-8 w-8 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold text-white">MindCare.AI</h1>
          <p className="text-blue-300 mt-1">Plataforma de bienestar organizacional</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Iniciar sesi&oacute;n</h2>

          <form action={loginAction} className="space-y-4">
            <input name="next" type="hidden" value={nextPath} />
            <div>
              <label className="block text-sm text-blue-200 mb-1" htmlFor="corporate-email">
                Correo corporativo
              </label>
              <input
                id="corporate-email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={showDemoCredentials ? DEMO_EMAIL : ""}
                placeholder="admin@empresa.com"
                required
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-400 transition"
              />
            </div>

            <div>
              <label className="block text-sm text-blue-200 mb-1" htmlFor="password">
                Contrase&ntilde;a
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                defaultValue={showDemoCredentials ? DEMO_PASSWORD : ""}
                placeholder="********"
                required
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-400 transition"
              />
            </div>

            {hasInvalidCredentials ? (
              <p className="rounded-lg border border-rose-300/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                Credenciales invalidas. Revisa tu correo y contrase&ntilde;a.
              </p>
            ) : null}

            {isRateLimited ? (
              <p className="rounded-lg border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                Demasiados intentos. Espera unos minutos antes de intentar nuevamente.
              </p>
            ) : null}

            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition mt-2"
            >
              Ingresar
            </button>
          </form>

          {showDemoCredentials ? (
            <div className="mt-5 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-blue-100">
              <p className="font-medium text-white">Credenciales demo</p>
              <p className="mt-1">Correo: {DEMO_EMAIL}</p>
              <p>Clave: {DEMO_PASSWORD}</p>
            </div>
          ) : null}

          <p className="text-center text-white/40 text-sm mt-6">
            &iquest;No tienes cuenta?{" "}
            <span className="text-blue-400 cursor-pointer hover:underline">
              Contacta a tu administrador
            </span>
          </p>
        </div>
      </div>
    </main>
  );
}
