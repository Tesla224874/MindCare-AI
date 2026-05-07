import { prisma } from "@/lib/prisma";

export type CaseStatusValue = "TRIAGE" | "ACTIVE" | "MONITORING" | "ESCALATED" | "CLOSED";
export type CasePriorityValue = "LOW" | "STANDARD" | "HIGH" | "URGENT";
export type CaseActionTypeValue =
  | "HUMAN_REVIEW"
  | "WELLBEING_CHECKIN"
  | "WORKLOAD_ADJUSTMENT"
  | "MANAGER_ALIGNMENT"
  | "CONSENT_REVIEW"
  | "EXTERNAL_REFERRAL"
  | "CASE_CLOSED";
type RiskLevelValue = "LOW" | "OBSERVATION" | "PREVENTIVE_ATTENTION" | "HIGH";

type CaseScope = {
  organizationId: string;
  teamId?: string | null;
};

type CaseActor = {
  organizationId: string;
  userId: string;
};

const caseStatuses = ["TRIAGE", "ACTIVE", "MONITORING", "ESCALATED", "CLOSED"] satisfies CaseStatusValue[];

function getCaseScopeFilter(scope: CaseScope) {
  return {
    organizationId: scope.organizationId,
    ...(scope.teamId ? { teamId: scope.teamId } : {}),
  };
}

function getPriorityFromRisk(level: RiskLevelValue): CasePriorityValue {
  if (level === "HIGH") {
    return "URGENT";
  }

  if (level === "PREVENTIVE_ATTENTION") {
    return "HIGH";
  }

  if (level === "OBSERVATION") {
    return "STANDARD";
  }

  return "LOW";
}

function getDueDate(priority: CasePriorityValue) {
  const dueAt = new Date();
  const daysByPriority: Record<CasePriorityValue, number> = {
    URGENT: 1,
    HIGH: 3,
    STANDARD: 7,
    LOW: 14,
  };

  dueAt.setDate(dueAt.getDate() + daysByPriority[priority]);

  return dueAt;
}

function getClosedAt(status: CaseStatusValue) {
  return status === "CLOSED" ? new Date() : null;
}

export async function getCasesOverview(scope: CaseScope) {
  const filter = getCaseScopeFilter(scope);
  const now = new Date();

  const [cases, statusCounts, overdueCount] = await Promise.all([
    prisma.interventionCase.findMany({
      where: filter,
      orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
      take: 50,
      include: {
        alert: {
          select: {
            title: true,
            level: true,
            status: true,
          },
        },
        team: {
          select: {
            name: true,
          },
        },
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
        subjectUser: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            notes: true,
            actions: true,
          },
        },
        notes: {
          orderBy: { createdAt: "desc" },
          take: 3,
          include: {
            author: {
              select: {
                name: true,
                role: true,
              },
            },
          },
        },
        actions: {
          orderBy: { createdAt: "desc" },
          take: 3,
          include: {
            actor: {
              select: {
                name: true,
                role: true,
              },
            },
          },
        },
      },
    }),
    prisma.interventionCase.groupBy({
      by: ["status"],
      where: filter,
      _count: {
        status: true,
      },
    }),
    prisma.interventionCase.count({
      where: {
        ...filter,
        status: {
          not: "CLOSED",
        },
        dueAt: {
          lt: now,
        },
      },
    }),
  ]);

  const counts = Object.fromEntries(caseStatuses.map((status) => [status, 0])) as Record<CaseStatusValue, number>;

  for (const item of statusCounts) {
    counts[item.status as CaseStatusValue] = item._count.status;
  }

  return {
    cases,
    counts,
    overdueCount,
  };
}

export async function openCaseFromAlert(actor: CaseActor, alertId: string) {
  return prisma.$transaction(async (tx) => {
    const alert = await tx.preventiveAlert.findFirst({
      where: {
        id: alertId,
        organizationId: actor.organizationId,
      },
      include: {
        case: true,
      },
    });

    if (!alert) {
      throw new Error("No se encontro la alerta en esta organizacion.");
    }

    if (alert.case) {
      return {
        caseId: alert.case.id,
        created: false,
      };
    }

    const priority = getPriorityFromRisk(alert.level as RiskLevelValue);
    const createdCase = await tx.interventionCase.create({
      data: {
        organizationId: alert.organizationId,
        alertId: alert.id,
        teamId: alert.teamId,
        ownerId: actor.userId,
        title: `Caso preventivo: ${alert.title}`,
        summary: alert.summary,
        objective: "Validar contexto, reducir riesgo laboral y coordinar una accion de apoyo no disciplinaria.",
        nextStep: alert.recommendedAction,
        status: "TRIAGE",
        priority,
        dueAt: getDueDate(priority),
        actions: {
          create: {
            actorId: actor.userId,
            type: "HUMAN_REVIEW",
            description: "Caso abierto desde una alerta preventiva para revision humana.",
            completedAt: new Date(),
          },
        },
      },
    });

    await tx.preventiveAlert.update({
      where: { id: alert.id },
      data: {
        status: "IN_REVIEW",
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "case.created.from_alert",
        entityType: "InterventionCase",
        entityId: createdCase.id,
        metadata: {
          alertId: alert.id,
          priority,
        },
      },
    });

    return {
      caseId: createdCase.id,
      created: true,
    };
  });
}

export async function updateCaseStatus(
  actor: CaseActor,
  caseId: string,
  status: CaseStatusValue,
  nextStep?: string,
) {
  const existingCase = await prisma.interventionCase.findFirst({
    where: {
      id: caseId,
      organizationId: actor.organizationId,
    },
  });

  if (!existingCase) {
    throw new Error("No se encontro el caso en esta organizacion.");
  }

  const updatedCase = await prisma.interventionCase.update({
    where: { id: existingCase.id },
    data: {
      status,
      closedAt: getClosedAt(status),
      ...(nextStep ? { nextStep } : {}),
      actions: {
        create: {
          actorId: actor.userId,
          type: status === "CLOSED" ? "CASE_CLOSED" : "HUMAN_REVIEW",
          description:
            status === "CLOSED"
              ? "Caso cerrado despues de revision humana."
              : `Estado actualizado a ${status}.`,
          completedAt: new Date(),
        },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: actor.organizationId,
      userId: actor.userId,
      action: "case.status.updated",
      entityType: "InterventionCase",
      entityId: updatedCase.id,
      metadata: {
        previousStatus: existingCase.status,
        nextStatus: updatedCase.status,
      },
    },
  });

  return updatedCase;
}

export async function addCaseNote(actor: CaseActor, caseId: string, body: string) {
  const trimmedBody = body.trim();

  if (trimmedBody.length < 12) {
    throw new Error("La nota debe tener al menos 12 caracteres.");
  }

  const existingCase = await prisma.interventionCase.findFirst({
    where: {
      id: caseId,
      organizationId: actor.organizationId,
    },
  });

  if (!existingCase) {
    throw new Error("No se encontro el caso en esta organizacion.");
  }

  const note = await prisma.caseNote.create({
    data: {
      caseId: existingCase.id,
      authorId: actor.userId,
      body: trimmedBody,
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: actor.organizationId,
      userId: actor.userId,
      action: "case.note.created",
      entityType: "CaseNote",
      entityId: note.id,
      metadata: {
        caseId: existingCase.id,
      },
    },
  });

  return note;
}

export async function recordCaseAction(
  actor: CaseActor,
  caseId: string,
  type: CaseActionTypeValue,
  description: string,
) {
  const trimmedDescription = description.trim();

  if (trimmedDescription.length < 12) {
    throw new Error("La accion debe describir claramente lo realizado.");
  }

  const existingCase = await prisma.interventionCase.findFirst({
    where: {
      id: caseId,
      organizationId: actor.organizationId,
    },
  });

  if (!existingCase) {
    throw new Error("No se encontro el caso en esta organizacion.");
  }

  const action = await prisma.caseAction.create({
    data: {
      caseId: existingCase.id,
      actorId: actor.userId,
      type,
      description: trimmedDescription,
      completedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: actor.organizationId,
      userId: actor.userId,
      action: "case.action.recorded",
      entityType: "CaseAction",
      entityId: action.id,
      metadata: {
        caseId: existingCase.id,
        type,
      },
    },
  });

  return action;
}
