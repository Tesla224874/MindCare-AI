import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import {
  mapAnalysisLevelToRiskLevel,
  shouldCreateAlert,
  getAlertTitle,
  type MessageAnalysis,
  type RiskLevel,
} from "@mindcare/shared/analysis";
import { prisma } from "@/lib/prisma";

function hashContent(content: string) {
  return createHash("sha256").update(content).digest("hex");
}

function mapRiskLevel(level: MessageAnalysis["level"]) {
  return mapAnalysisLevelToRiskLevel(level);
}

function getAlertSummary(analysis: MessageAnalysis) {
  const signalLabels = analysis.signals.map((signal) => signal.label).slice(0, 3);

  if (signalLabels.length === 0) {
    return `Analisis con puntaje ${analysis.score}/100 y confianza ${analysis.confidence}%.`;
  }

  return `Senales principales: ${signalLabels.join(", ")}. Puntaje ${analysis.score}/100.`;
}

function getRecommendedAction(level: RiskLevel, analysis: MessageAnalysis) {
  const firstRiskSignal = analysis.signals.find((signal) => signal.kind === "risk");

  if (firstRiskSignal) {
    return firstRiskSignal.recommendation;
  }

  if (level === "HIGH") {
    return "Activar protocolo humano de apoyo y revisar el contexto del equipo.";
  }

  return "Revisar carga laboral y coordinar seguimiento preventivo.";
}

export async function saveMessageAnalysis({
  authorId,
  organizationId,
  teamId,
  openedById,
  message,
  analysis,
}: {
  authorId: string;
  organizationId: string;
  teamId?: string | null;
  openedById: string;
  message: string;
  analysis: MessageAnalysis;
}) {
  const level = mapRiskLevel(analysis.level);

  return prisma.$transaction(async (tx) => {
    const savedMessage = await tx.message.create({
      data: {
        organizationId,
        teamId,
        authorId,
        contentHash: hashContent(message),
        redactedPreview: message.slice(0, 80),
        sentAt: new Date(),
        analyses: {
          create: {
            userId: authorId,
            score: analysis.score,
            level,
            confidence: analysis.confidence,
            signals: analysis.signals as unknown as Prisma.InputJsonValue,
            modelName: analysis.modelName,
          },
        },
      },
      include: {
        analyses: true,
      },
    });

    const savedAnalysis = savedMessage.analyses[0];
    let alertId: string | null = null;

    if (shouldCreateAlert(level)) {
      const alert = await tx.preventiveAlert.create({
        data: {
          organizationId,
          teamId,
          openedById,
          title: getAlertTitle(level),
          summary: getAlertSummary(analysis),
          level,
          recommendedAction: getRecommendedAction(level, analysis),
        },
      });

      alertId = alert.id;

      await tx.auditLog.create({
        data: {
          organizationId,
          userId: openedById,
          action: "alert.auto.created",
          entityType: "PreventiveAlert",
          entityId: alert.id,
          metadata: {
            messageId: savedMessage.id,
            analysisId: savedAnalysis?.id,
            level,
            score: analysis.score,
          },
        },
      });
    }

    await tx.auditLog.create({
      data: {
        organizationId,
        userId: openedById,
        action: "message.analysis.created",
        entityType: "MessageAnalysis",
        entityId: savedAnalysis?.id,
        metadata: {
          messageId: savedMessage.id,
          alertId,
          level,
          score: analysis.score,
        },
      },
    });

    return {
      message: savedMessage,
      alertCreated: Boolean(alertId),
      alertId,
    };
  });
}

export async function getMessageLabOverview(organizationId: string) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      users: {
        where: { email: "marco.vega@empresa.com" },
        take: 1,
      },
      messages: {
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          author: true,
          team: true,
          analyses: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!organization || organization.users.length === 0) {
    return null;
  }

  return {
    organization,
    author: organization.users[0],
    recentMessages: organization.messages,
  };
}
