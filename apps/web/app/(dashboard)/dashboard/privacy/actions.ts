"use server";

import { ConsentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireRoles } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export type UpdateConsentState = {
  status: "idle" | "success" | "error";
  message: string;
};

const allowedStatuses = new Set<ConsentStatus>([
  ConsentStatus.PENDING,
  ConsentStatus.GRANTED,
  ConsentStatus.REVOKED,
]);

export async function updateConsentAction(
  _previousState: UpdateConsentState,
  formData: FormData,
): Promise<UpdateConsentState> {
  const currentUser = await requireRoles(["ADMIN", "WELLBEING"]);
  const consentId = String(formData.get("consentId") ?? "").trim();
  const status = String(formData.get("status") ?? "") as ConsentStatus;

  if (!consentId || !allowedStatuses.has(status)) {
    return {
      status: "error",
      message: "Selecciona un consentimiento y estado valido.",
    };
  }

  const consent = await prisma.consent.findFirst({
    where: {
      id: consentId,
      user: {
        organizationId: currentUser.organization.id,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  if (!consent) {
    return {
      status: "error",
      message: "No se encontro el consentimiento en esta organizacion.",
    };
  }

  const now = new Date();
  const updatedConsent = await prisma.consent.update({
    where: { id: consent.id },
    data: {
      status,
      grantedAt: status === ConsentStatus.GRANTED ? now : consent.grantedAt,
      revokedAt: status === ConsentStatus.REVOKED ? now : null,
      notes: `Actualizado desde panel por ${currentUser.email}`,
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: currentUser.organization.id,
      userId: currentUser.id,
      action: "privacy.consent.updated",
      entityType: "Consent",
      entityId: updatedConsent.id,
      metadata: {
        subjectUserId: consent.user.id,
        subjectEmail: consent.user.email,
        source: updatedConsent.source,
        status: updatedConsent.status,
      },
    },
  });

  revalidatePath("/dashboard/privacy");
  revalidatePath("/dashboard/organization");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: `Consentimiento de ${consent.user.name} actualizado a ${status}.`,
  };
}
