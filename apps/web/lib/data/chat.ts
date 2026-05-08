import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import {
  getAlertTitle,
  mapAnalysisLevelToRiskLevel,
  shouldCreateAlert,
  type MessageAnalysis,
  type RiskLevel,
} from "@mindcare/shared/analysis";
import { analyzeMessageForStorage } from "@/lib/analysis";
import { generateAssistantReply, type ChatHistoryItem } from "@/lib/chat/assistant";
import { prisma } from "@/lib/prisma";

type ChatActor = {
  id: string;
  organizationId: string;
  teamId?: string | null;
  role: string;
};

type ChatSendResult = {
  sessionId: string;
  assistantMessage: string;
  riskLevel: RiskLevel;
  score: number;
  alertCreated: boolean;
};

const assistantIntro =
  "Soy el asistente preventivo de MindCare.AI. Puedo ayudarte a ordenar lo que estas viviendo y sugerir siguientes pasos de apoyo, sin diagnosticar ni reemplazar acompanamiento profesional.";

function hashContent(content: string) {
  return createHash("sha256").update(content).digest("hex");
}

function redactPreview(content: string) {
  return content.replace(/\s+/g, " ").trim().slice(0, 140);
}

function getSessionTitle(message: string) {
  const preview = redactPreview(message);

  if (!preview) {
    return "Conversacion preventiva";
  }

  return preview.length > 48 ? `${preview.slice(0, 48)}...` : preview;
}

function getRecommendedAction(analysis: MessageAnalysis, riskLevel: RiskLevel) {
  const firstRiskSignal = analysis.signals.find((signal) => signal.kind === "risk");

  if (firstRiskSignal) {
    return firstRiskSignal.recommendation;
  }

  if (riskLevel === "HIGH") {
    return "Activar apoyo humano inmediato y revisar el contexto con cuidado.";
  }

  return "Tomar una pausa breve, registrar contexto y coordinar seguimiento preventivo si la situacion continua.";
}

function getAlertSummary(analysis: MessageAnalysis) {
  const signalLabels = analysis.signals
    .filter((signal) => signal.kind === "risk")
    .map((signal) => signal.label)
    .slice(0, 3);

  if (signalLabels.length === 0) {
    return `Chat preventivo con puntaje ${analysis.score}/100 y confianza ${analysis.confidence}%.`;
  }

  return `Chat preventivo con senales principales: ${signalLabels.join(", ")}. Puntaje ${analysis.score}/100.`;
}

function toChatHistory(messages: Array<{ role: "USER" | "ASSISTANT"; redactedPreview: string }>): ChatHistoryItem[] {
  return messages.map((item) => ({
    role: item.role,
    content: item.redactedPreview,
  }));
}

export async function getChatOverview(actor: ChatActor) {
  const session = await prisma.chatSession.findFirst({
    where: {
      organizationId: actor.organizationId,
      userId: actor.id,
      status: "ACTIVE",
    },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 20,
        include: {
          analysis: true,
        },
      },
    },
  });

  if (session) {
    return {
      session,
      messages: session.messages,
      intro: assistantIntro,
    };
  }

  return {
    session: null,
    messages: [],
    intro: assistantIntro,
  };
}

export async function sendChatMessage(actor: ChatActor, message: string): Promise<ChatSendResult> {
  const trimmedMessage = message.trim();

  if (trimmedMessage.length < 4) {
    throw new Error("Escribe un poco mas para que el asistente pueda responder con contexto.");
  }

  if (trimmedMessage.length > 1500) {
    throw new Error("El mensaje es muy largo. Intenta resumirlo en menos de 1500 caracteres.");
  }

  const analysis = await analyzeMessageForStorage(trimmedMessage);
  const riskLevel = mapAnalysisLevelToRiskLevel(analysis.level);
  const existingSession = await prisma.chatSession.findFirst({
    where: {
      organizationId: actor.organizationId,
      userId: actor.id,
      status: "ACTIVE",
    },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          role: true,
          redactedPreview: true,
        },
      },
    },
  });
  const assistantReply = await generateAssistantReply({
    message: trimmedMessage,
    analysis,
    riskLevel,
    history: toChatHistory(existingSession?.messages.reverse() ?? []),
  });
  const assistantMessage = assistantReply.message;

  return prisma.$transaction(async (tx) => {
    const session =
      (existingSession
        ? await tx.chatSession.findUnique({
            where: { id: existingSession.id },
          })
        : null) ??
      (await tx.chatSession.create({
        data: {
          organizationId: actor.organizationId,
          teamId: actor.teamId,
          userId: actor.id,
          title: getSessionTitle(trimmedMessage),
        },
      }));

    const userMessage = await tx.chatMessage.create({
      data: {
        sessionId: session.id,
        authorId: actor.id,
        role: "USER",
        contentHash: hashContent(trimmedMessage),
        redactedPreview: redactPreview(trimmedMessage),
      },
    });

    let alertId: string | null = null;

    if (shouldCreateAlert(riskLevel)) {
      const alert = await tx.preventiveAlert.create({
        data: {
          organizationId: actor.organizationId,
          teamId: actor.teamId,
          openedById: actor.id,
          title: getAlertTitle(riskLevel),
          summary: getAlertSummary(analysis),
          level: riskLevel,
          recommendedAction: getRecommendedAction(analysis, riskLevel),
        },
      });

      alertId = alert.id;
    }

    const chatAnalysis = await tx.chatAnalysis.create({
      data: {
        messageId: userMessage.id,
        alertId,
        score: analysis.score,
        level: riskLevel,
        confidence: analysis.confidence,
        signals: analysis.signals as unknown as Prisma.InputJsonValue,
        modelName: analysis.modelName,
      },
    });

    await tx.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "ASSISTANT",
        contentHash: hashContent(assistantMessage),
        redactedPreview: assistantMessage,
      },
    });

    await tx.chatSession.update({
      where: { id: session.id },
      data: {
        teamId: actor.teamId,
        updatedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: actor.organizationId,
        userId: actor.id,
        action: alertId ? "chat.message.created.alert" : "chat.message.created",
        entityType: "ChatAnalysis",
        entityId: chatAnalysis.id,
        metadata: {
          sessionId: session.id,
          messageId: userMessage.id,
          alertId,
          level: riskLevel,
          score: analysis.score,
          chatModelName: assistantReply.modelName,
        },
      },
    });

    return {
      sessionId: session.id,
      assistantMessage,
      riskLevel,
      score: analysis.score,
      alertCreated: Boolean(alertId),
    };
  });
}

export async function startNewChat(actor: ChatActor) {
  const updated = await prisma.chatSession.updateMany({
    where: {
      organizationId: actor.organizationId,
      userId: actor.id,
      status: "ACTIVE",
    },
    data: {
      status: "ARCHIVED",
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: actor.organizationId,
      userId: actor.id,
      action: "chat.session.started",
      entityType: "ChatSession",
      metadata: {
        archivedSessions: updated.count,
      },
    },
  });

  return updated.count;
}
