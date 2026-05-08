import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-950">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center">
        <Image className="mx-auto rounded-lg" src="/images/mindcare-icon.svg" alt="" width={56} height={56} />
        <h1 className="mt-5 text-2xl font-semibold tracking-normal">Pagina no encontrada</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          La ruta que intentas abrir no existe o no esta disponible para este MVP.
        </p>
        <Link
          href="/dashboard"
          className="mt-5 inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Volver al dashboard
        </Link>
      </section>
    </main>
  );
}
