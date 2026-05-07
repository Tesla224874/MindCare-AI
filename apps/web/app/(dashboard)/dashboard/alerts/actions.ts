"use server";

import { AlertStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireRoles } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export type UpdateAlertState = {
  status: "idle" | "success" | "error";
  message: string;
};

const allowedStatuses = new Set<AlertStatus>([
  AlertStatus.OPEN,
  AlertStatus.IN_REVIEW,
  AlertStatus.RESOLVED,
  AlertStatus.DISMISSED,
]);

export async function updateAlertStatusAction(
  _previousState: UpdateAlertState,
  formData: FormData,
): Promise<UpdateAlertState> {
  const currentUser = await requireRoles(["ADMIN", "WELLBEING"]);
  const alertId = String(formData.get("alertId") ?? "").trim();
  const status = String(formData.get("status") ?? "") as AlertStatus;

  if (!alertId || !allowedStatuses.has(status)) {
    return {
      status: "error",
      message: "Selecciona una alerta y un estado valido.",
    };
  }

  const alert = await prisma.preventiveAlert.findFirst({
    where: {
      id: alertId,
      organizationId: currentUser.organization.id,
    },
  });

  if (!alert) {
    return {
      status: "error",
      message: "No se encontro la alerta en esta organizacion.",
    };
  }

  const updatedAlert = await prisma.preventiveAlert.update({
    where: { id: alert.id },
    data: {
      status,
      resolvedAt: status === AlertStatus.RESOLVED || status === AlertStatus.DISMISSED ? new Date() : null,
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: currentUser.organization.id,
      userId: currentUser.id,
      action: "alert.status.updated",
      entityType: "PreventiveAlert",
      entityId: updatedAlert.id,
      metadata: {
        previousStatus: alert.status,
        nextStatus: updatedAlert.status,
      },
    },
  });

  revalidatePath("/dashboard/alerts");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/organization");

  return {
    status: "success",
    message: `Alerta actualizada a ${updatedAlert.status}.`,
  };
}
