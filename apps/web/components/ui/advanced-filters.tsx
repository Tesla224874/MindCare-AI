"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Filter, RotateCcw } from "lucide-react";
import type { AppRole } from "@mindcare/shared/roles";

type FilterOptions = {
  dateRange: "7d" | "30d" | "90d";
  riskLevel?: "HIGH" | "PREVENTIVE_ATTENTION" | "OBSERVATION" | "LOW";
  alertStatus?: "OPEN" | "IN_REVIEW" | "RESOLVED" | "DISMISSED";
};

type AdvancedFiltersProps = {
  userRole: AppRole;
};

const rolesWithFilters = new Set<AppRole>(["ADMIN", "WELLBEING", "TEAM_LEAD"]);

const dateOptions = [
  { value: "7d", label: "Ultimos 7 dias" },
  { value: "30d", label: "Ultimos 30 dias" },
  { value: "90d", label: "Ultimos 90 dias" },
] satisfies Array<{ value: FilterOptions["dateRange"]; label: string }>;

const riskOptions = [
  { value: "HIGH", label: "Riesgo alto" },
  { value: "PREVENTIVE_ATTENTION", label: "Atencion preventiva" },
  { value: "OBSERVATION", label: "Observacion" },
  { value: "LOW", label: "Bajo" },
] satisfies Array<{ value: NonNullable<FilterOptions["riskLevel"]>; label: string }>;

const alertStatusOptions = [
  { value: "OPEN", label: "Abierta" },
  { value: "IN_REVIEW", label: "En revision" },
  { value: "RESOLVED", label: "Resuelta" },
  { value: "DISMISSED", label: "Descartada" },
] satisfies Array<{ value: NonNullable<FilterOptions["alertStatus"]>; label: string }>;

function isDateRange(value: string | null): value is FilterOptions["dateRange"] {
  return value === "7d" || value === "30d" || value === "90d";
}

function isRiskLevel(value: string | null): value is NonNullable<FilterOptions["riskLevel"]> {
  return riskOptions.some((option) => option.value === value);
}

function isAlertStatus(value: string | null): value is NonNullable<FilterOptions["alertStatus"]> {
  return alertStatusOptions.some((option) => option.value === value);
}

export function AdvancedFilters({ userRole }: AdvancedFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dateRangeParam = searchParams.get("dateRange");
  const riskLevelParam = searchParams.get("riskLevel");
  const alertStatusParam = searchParams.get("alertStatus");
  const [isOpen, setIsOpen] = useState(false);
  const canUseFilters = rolesWithFilters.has(userRole) && pathname === "/dashboard";
  const [filters, setFilters] = useState<FilterOptions>(() => ({
    dateRange: isDateRange(dateRangeParam) ? dateRangeParam : "7d",
    riskLevel: isRiskLevel(riskLevelParam) ? riskLevelParam : undefined,
    alertStatus: isAlertStatus(alertStatusParam) ? alertStatusParam : undefined,
  }));

  const hasActiveFilters = useMemo(
    () => filters.dateRange !== "7d" || Boolean(filters.riskLevel) || Boolean(filters.alertStatus),
    [filters],
  );

  const handleFilterChange = (key: keyof FilterOptions, value: string | undefined) => {
    setFilters((previousFilters) => ({
      ...previousFilters,
      [key]: value || undefined,
    }));
  };

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();

    if (filters.dateRange !== "7d") {
      params.set("dateRange", filters.dateRange);
    }

    if (filters.riskLevel) {
      params.set("riskLevel", filters.riskLevel);
    }

    if (filters.alertStatus) {
      params.set("alertStatus", filters.alertStatus);
    }

    const queryString = params.toString();
    router.push(queryString ? `/dashboard?${queryString}` : "/dashboard");
    setIsOpen(false);
  }, [filters, router]);

  function resetFilters() {
    setFilters({
      dateRange: "7d",
      riskLevel: undefined,
      alertStatus: undefined,
    });
    router.push("/dashboard");
    setIsOpen(false);
  }

  if (!canUseFilters) {
    return null;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
          hasActiveFilters
            ? "border-blue-200 bg-blue-50 text-blue-700"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        }`}
      >
        <Filter className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Filtros</span>
        {hasActiveFilters ? <span className="ml-1 inline-block h-2 w-2 rounded-full bg-blue-600" /> : null}
        <ChevronDown className="h-4 w-4" aria-hidden="true" />
      </button>

      {isOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Cerrar filtros"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-lg">
            <div className="border-b border-slate-200 px-4 py-3">
              <p className="font-medium text-slate-900">Filtros avanzados</p>
              <p className="mt-1 text-xs text-slate-500">Solo disponibles para roles operativos.</p>
            </div>

            <div className="space-y-4 p-4">
              <div>
                <label className="block text-xs font-medium text-slate-700">Rango de fechas</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {dateOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleFilterChange("dateRange", option.value)}
                      className={`rounded-md px-3 py-2 text-xs font-medium transition ${
                        filters.dateRange === option.value
                          ? "bg-blue-600 text-white"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block text-xs font-medium text-slate-700">
                Nivel de riesgo
                <select
                  value={filters.riskLevel ?? ""}
                  onChange={(event) => handleFilterChange("riskLevel", event.target.value || undefined)}
                  className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700 outline-none focus:border-blue-500"
                >
                  <option value="">Todos</option>
                  {riskOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-medium text-slate-700">
                Estado de alerta
                <select
                  value={filters.alertStatus ?? ""}
                  onChange={(event) => handleFilterChange("alertStatus", event.target.value || undefined)}
                  className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700 outline-none focus:border-blue-500"
                >
                  <option value="">Todos</option>
                  {alertStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex gap-2 border-t border-slate-200 px-4 py-3">
              <button
                type="button"
                onClick={applyFilters}
                className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Aplicar
              </button>
              <button
                type="button"
                onClick={resetFilters}
                disabled={!hasActiveFilters}
                className="flex items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Limpiar
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
