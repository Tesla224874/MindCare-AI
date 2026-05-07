import { AlertStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type AlertsScope = {
  organizationId: string;
  teamId?: string | null;
};

function getScopeFilter(scope: AlertsScope) {
  return {
    organizationId: scope.organizationId,
    ...(scope.teamId ? { teamId: scope.teamId } : {}),
  };
}

export async function getAlertsOverview(scope: AlertsScope) {
  const filter = getScopeFilter(scope);

  const [alerts, statusCounts] = await Promise.all([
    prisma.preventiveAlert.findMany({
      where: filter,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 50,
      include: {
        team: {
          select: {
            name: true,
          },
        },
        openedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.preventiveAlert.groupBy({
      by: ["status"],
      where: filter,
      _count: {
        status: true,
      },
    }),
  ]);

  const counts = {
    [AlertStatus.OPEN]: 0,
    [AlertStatus.IN_REVIEW]: 0,
    [AlertStatus.RESOLVED]: 0,
    [AlertStatus.DISMISSED]: 0,
  };

  for (const item of statusCounts) {
    counts[item.status] = item._count.status;
  }

  return {
    alerts,
    counts,
  };
}
