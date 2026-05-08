"use server";

import { revalidatePath } from "next/cache";
import { requireRoles } from "@/lib/authorization";
import { sendChatMessage, startNewChat } from "@/lib/data/chat";

export type ChatActionState = {
  status: "idle" | "success" | "error";
  message: string;
  requestId: number;
  submittedMessage?: string;
  assistantMessage?: string;
  alertCreated?: boolean;
  riskLevel?: string;
  score?: number;
};

export type NewChatActionState = {
  status: "idle" | "success" | "error";
  message: string;
  requestId: number;
};

function getActionErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo enviar el mensaje.";
}

export async function sendChatMessageAction(
  previousState: ChatActionState,
  formData: FormData,
): Promise<ChatActionState> {
  const currentUser = await requireRoles(["ADMIN", "WELLBEING", "TEAM_LEAD", "EMPLOYEE"]);
  const message = String(formData.get("message") ?? "").trim();

  try {
    const result = await sendChatMessage(
      {
        id: currentUser.id,
        organizationId: currentUser.organization.id,
        teamId: currentUser.team?.id,
        role: currentUser.role,
      },
      message,
    );

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/chat");
    revalidatePath("/dashboard/alerts");

    return {
      status: "success",
      requestId: previousState.requestId + 1,
      message: result.alertCreated
        ? "Respuesta generada y alerta preventiva creada para revision humana."
        : "Respuesta generada desde el asistente preventivo.",
      submittedMessage: message,
      assistantMessage: result.assistantMessage,
      alertCreated: result.alertCreated,
      riskLevel: result.riskLevel,
      score: result.score,
    };
  } catch (error) {
    return {
      status: "error",
      requestId: previousState.requestId + 1,
      message: getActionErrorMessage(error),
    };
  }
}

export async function startNewChatAction(
  previousState: NewChatActionState,
  formData: FormData,
): Promise<NewChatActionState> {
  void formData;

  const currentUser = await requireRoles(["ADMIN", "WELLBEING", "TEAM_LEAD", "EMPLOYEE"]);

  try {
    await startNewChat({
      id: currentUser.id,
      organizationId: currentUser.organization.id,
      teamId: currentUser.team?.id,
      role: currentUser.role,
    });

    revalidatePath("/dashboard/chat");

    return {
      status: "success",
      requestId: previousState.requestId + 1,
      message: "Nuevo chat iniciado.",
    };
  } catch (error) {
    return {
      status: "error",
      requestId: previousState.requestId + 1,
      message: getActionErrorMessage(error),
    };
  }
}
