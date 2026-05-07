"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
  BrainCircuit,
  Building2,
  CheckCircle2,
  ClipboardList,
  LockKeyhole,
  LogOut,
  MessageSquareText,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";
import clsx from "clsx";
import { canAccessPath, getRoleLabel, type AppRole } from "@/lib/permissions";
import { AdvancedFilters } from "@/components/ui/advanced-filters";

const navItems = [
  { href: "/dashboard", label: "Resumen", icon: Activity },
  { href: "/dashboard/alerts", label: "Alertas", icon: Bell },
  { href: "/dashboard/cases", label: "Casos", icon: ClipboardList },
  { href: "/dashboard/messages", label: "Senales de texto", icon: MessageSquareText },
  { href: "/dashboard/organization", label: "Organizacion", icon: Building2 },
  { href: "/dashboard/privacy", label: "Privacidad", icon: ShieldCheck },
];

const pageTitles: Record<string, string> = {
  "/dashboard": "Resumen de bienestar",
  "/dashboard/alerts": "Alertas preventivas",
  "/dashboard/cases": "Casos preventivos",
  "/dashboard/messages": "Analisis de mensajes",
  "/dashboard/organization": "Organizacion",
  "/dashboard/privacy": "Privacidad",
};

type DashboardShellProps = {
  children: React.ReactNode;
  currentUser: {
    name: string;
    email: string;
    role: string;
    teamName: string | null;
    organizationName: string;
  };
};

export function DashboardShell({ children, currentUser }: DashboardShellProps) {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "Panel organizacional";
  const roleLabel = getRoleLabel(currentUser.role);
  const visibleNavItems = navItems.filter((item) => canAccessPath(currentUser.role, item.href));
  const userInitials = currentUser.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white px-5 py-6 lg:block">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 text-white">
              <BrainCircuit className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-lg font-semibold">MindCare.AI</p>
              <p className="text-xs text-slate-500">Panel organizacional</p>
            </div>
          </div>

          <nav className="mt-8 space-y-1 text-sm">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  className={clsx(
                    "flex items-center gap-3 rounded-md px-3 py-2 transition",
                    isActive
                      ? "bg-blue-50 font-medium text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  )}
                  href={item.href}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-10 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
              <LockKeyhole className="h-4 w-4 text-teal-600" aria-hidden="true" />
              Datos protegidos
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Reportes agregados para prevenir exposicion individual innecesaria.
            </p>
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-900 text-sm font-semibold text-white">
                {userInitials || <UserCircle2 className="h-5 w-5" aria-hidden="true" />}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{currentUser.name}</p>
                <p className="truncate text-xs text-slate-500">{roleLabel}</p>
              </div>
            </div>
            <p className="mt-3 truncate text-xs text-slate-500">{currentUser.email}</p>
            <p className="mt-1 truncate text-xs text-slate-500">{currentUser.teamName ?? "Sin equipo asignado"}</p>
          </div>

          <form action="/logout" method="post" className="mt-4">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Cerrar sesion
            </button>
          </form>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="border-b border-slate-200 bg-white px-5 py-4 md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">{currentUser.organizationName}</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950">{title}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <AdvancedFilters userRole={currentUser.role as AppRole} />
                <div className="flex w-fit items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  <UserCircle2 className="h-4 w-4 text-blue-600" aria-hidden="true" />
                  {roleLabel}
                </div>
                <div className="flex w-fit items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  <CheckCircle2 className="h-4 w-4 text-teal-600" aria-hidden="true" />
                  Monitoreo preventivo activo
                </div>
              </div>
            </div>
          </header>

          <nav className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-5 py-3 text-sm lg:hidden">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  className={clsx(
                    "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 transition",
                    isActive ? "bg-blue-50 font-medium text-blue-700" : "text-slate-600",
                  )}
                  href={item.href}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
            <form action="/logout" method="post" className="shrink-0">
              <button className="flex items-center gap-2 rounded-md px-3 py-2 text-slate-600" type="submit">
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Salir
              </button>
            </form>
          </nav>

          <div className="px-5 py-6 md:px-8">{children}</div>
        </section>
      </div>
    </main>
  );
}
