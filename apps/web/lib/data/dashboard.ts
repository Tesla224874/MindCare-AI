import { Prisma } from "@prisma/client";
import { riskOrder } from "@mindcare/shared/analysis";
import { prisma } from "@/lib/prisma";

type DashboardScope = {
  organizationId: string;
  teamId?: string | null;
};

function getSignalLabel(signal: unknown) {
  if (!signal || typeof signal !== "object") {
    return null;
  }

  const label = (signal as { label?: unknown }).label;
  return typeof label === "string" ? label : null;
}

function getScopeFilter(scope: DashboardScope) {
  return {
    organizationId: scope.organizationId,
    ...(scope.teamId ? { teamId: scope.teamId } : {}),
  };
}

function toWellbeingIndex(averageScore?: number | null) {
  if (averageScore === null || averageScore === undefined) {
    return 100;
  }

  return Math.max(0, Math.min(100, Math.round(100 - averageScore)));
}

const signalColors = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-blue-500",
  "bg-purple-500",
];

export async function getDashboardOverview(scope: DashboardScope) {
  const messageFilter = getScopeFilter(scope);
  const userFilter = {
    organizationId: scope.organizationId,
    ...(scope.teamId ? { teamId: scope.teamId } : {}),
  };

  const [organization, activeUsers, messagesCount, openAlertsCount, analysisStats, riskCounts, recentAlerts, analyses] =
    await Promise.all([
      prisma.organization.findUnique({
        where: { id: scope.organizationId },
        select: {
          id: true,
          name: true,
        },
      }),
      prisma.user.count({
        where: {
          ...userFilter,
          isActive: true,
        },
      }),
      prisma.message.count({
        where: messageFilter,
      }),
      prisma.preventiveAlert.count({
        where: {
          ...messageFilter,
          status: {
            in: ["OPEN", "IN_REVIEW"],
          },
        },
      }),
      prisma.messageAnalysis.aggregate({
        where: {
          message: messageFilter,
        },
        _avg: {
          score: true,
        },
        _count: {
          _all: true,
        },
      }),
      prisma.messageAnalysis.groupBy({
        by: ["level"],
        where: {
          message: messageFilter,
        },
        _count: {
          level: true,
        },
      }),
      prisma.preventiveAlert.findMany({
        where: messageFilter,
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.messageAnalysis.findMany({
        where: {
          message: messageFilter,
        },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          signals: true,
        },
      }),
    ]);

  const signalCounts = new Map<string, number>();

  for (const analysis of analyses) {
    const signals = Array.isArray(analysis.signals) ? analysis.signals : [];

    for (const signal of signals as Prisma.JsonArray) {
      const label = getSignalLabel(signal);

      if (label) {
        signalCounts.set(label, (signalCounts.get(label) ?? 0) + 1);
      }
    }
  }

  const totalSignalMatches = [...signalCounts.values()].reduce((total, count) => total + count, 0);
  const signals = [...signalCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count], index) => ({
      label,
      count,
      value: totalSignalMatches ? Math.max(8, Math.round((count / totalSignalMatches) * 100)) : 0,
      color: signalColors[index] ?? "bg-slate-500",
    }));

  const totalAnalyses = analysisStats._count._all;
  const elevatedRiskCount = riskCounts
    .filter((item) => riskOrder[item.level] >= riskOrder.PREVENTIVE_ATTENTION)
    .reduce((total, item) => total + item._count.level, 0);
  const aggregatedRisk = totalAnalyses ? Math.round((elevatedRiskCount / totalAnalyses) * 100) : 0;

  return {
    organization,
    metrics: {
      wellbeingIndex: toWellbeingIndex(analysisStats._avg.score),
      openAlerts: openAlertsCount,
      aggregatedRisk,
      activeUsers,
      messagesCount,
      analysesCount: totalAnalyses,
    },
    signals,
    totalSignalMatches,
    recentAlerts,
  };
}
