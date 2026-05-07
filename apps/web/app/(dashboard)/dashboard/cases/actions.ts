"use server";

import { revalidatePath } from "next/cache";
import { requireRoles } from "@/lib/authorization";
import {
  addCaseNote,
  openCaseFromAlert,
  recordCaseAction,
  updateCaseStatus,
  type CaseActionTypeValue,
  type CaseStatusValue,
} from "@/lib/data/cases";

export type CaseActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const allowedStatuses = new Set<CaseStatusValue>(["TRIAGE", "ACTIVE", "MONITORING", "ESCALATED", "CLOSED"]);

const allowedActionTypes = new Set<CaseActionTypeValue>([
  "HUMAN_REVIEW",
  "WELLBEING_CHECKIN",
  "WORKLOAD_ADJUSTMENT",
  "MANAGER_ALIGNMENT",
  "CONSENT_REVIEW",
  "EXTERNAL_REFERRAL",
  "CASE_CLOSED",
]);

function revalidateCaseViews() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/alerts");
  revalidatePath("/dashboard/cases");
  revalidatePath("/dashboard/organization");
}

function getActionErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo completar la accion.";
}

export async function openCaseFromAlertAction(
  _previousState: CaseActionState,
  formData: FormData,
): Promise<CaseActionState> {
  const currentUser = await requireRoles(["ADMIN", "WELLBEING"]);
  const alertId = String(formData.get("alertId") ?? "").trim();

  if (!alertId) {
    return {
      status: "error",
      message: "Selecciona una alerta valida para abrir el caso.",
    };
  }

  try {
    const result = await openCaseFromAlert(
      {
        organizationId: currentUser.organization.id,
        userId: currentUser.id,
      },
      alertId,
    );

    revalidateCaseViews();

    return {
      status: "success",
      message: result.created
        ? "Caso preventivo abierto y alerta puesta en revision."
        : "Esta alerta ya tenia un caso preventivo abierto.",
    };
  } catch (error) {
    return {
      status: "error",
      message: getActionErrorMessage(error),
    };
  }
}

export async function updateCaseStatusAction(
  _previousState: CaseActionState,
  formData: FormData,
): Promise<CaseActionState> {
  const currentUser = await requireRoles(["ADMIN", "WELLBEING"]);
  const caseId = String(formData.get("caseId") ?? "").trim();
  const status = String(formData.get("status") ?? "") as CaseStatusValue;
  const nextStep = String(formData.get("nextStep") ?? "").trim();

  if (!caseId || !allowedStatuses.has(status)) {
    return {
      status: "error",
      message: "Selecciona un caso y un estado valido.",
    };
  }

  try {
    await updateCaseStatus(
      {
        organizationId: currentUser.organization.id,
        userId: currentUser.id,
      },
      caseId,
      status,
      nextStep,
    );

    revalidateCaseViews();

    return {
      status: "success",
      message: `Caso actualizado a ${status}.`,
    };
  } catch (error) {
    return {
      status: "error",
      message: getActionErrorMessage(error),
    };
  }
}

export async function addCaseNoteAction(
  _previousState: CaseActionState,
  formData: FormData,
): Promise<CaseActionState> {
  const currentUser = await requireRoles(["ADMIN", "WELLBEING", "AUDITOR"]);
  const caseId = String(formData.get("caseId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!caseId) {
    return {
      status: "error",
      message: "Selecciona un caso valido.",
    };
  }

  try {
    await addCaseNote(
      {
        organizationId: currentUser.organization.id,
        userId: currentUser.id,
      },
      caseId,
      body,
    );

    revalidateCaseViews();

    return {
      status: "success",
      message: "Nota registrada en el caso preventivo.",
    };
  } catch (error) {
    return {
      status: "error",
      message: getActionErrorMessage(error),
    };
  }
}

export async function recordCaseActionAction(
  _previousState: CaseActionState,
  formData: FormData,
): Promise<CaseActionState> {
  const currentUser = await requireRoles(["ADMIN", "WELLBEING"]);
  const caseId = String(formData.get("caseId") ?? "").trim();
  const type = String(formData.get("type") ?? "") as CaseActionTypeValue;
  const description = String(formData.get("description") ?? "").trim();

  if (!caseId || !allowedActionTypes.has(type)) {
    return {
      status: "error",
      message: "Selecciona un caso y un tipo de accion validos.",
    };
  }

  try {
    await recordCaseAction(
      {
        organizationId: currentUser.organization.id,
        userId: currentUser.id,
      },
      caseId,
      type,
      description,
    );

    revalidateCaseViews();

    return {
      status: "success",
      message: "Accion registrada en el caso preventivo.",
    };
  } catch (error) {
    return {
      status: "error",
      message: getActionErrorMessage(error),
    };
  }
}
