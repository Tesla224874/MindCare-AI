"use server";

import { revalidatePath } from "next/cache";
import { requireRoles } from "@/lib/authorization";
import { analyzeMessageForStorage } from "@/lib/analysis";
import { getMessageLabOverview, saveMessageAnalysis } from "@/lib/data/messages";

export type SaveAnalysisState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function saveAnalysisAction(
  _previousState: SaveAnalysisState,
  formData: FormData,
): Promise<SaveAnalysisState> {
  const currentUser = await requireRoles(["ADMIN", "WELLBEING"]);

  const message = String(formData.get("message") ?? "").trim();

  if (message.length < 12) {
    return {
      status: "error",
      message: "Escribe un mensaje un poco mas largo antes de guardarlo.",
    };
  }

  const context = await getMessageLabOverview(currentUser.organization.id);

  if (!context) {
    return {
      status: "error",
      message: "No se encontro la organizacion demo. Ejecuta npm.cmd run db:seed.",
    };
  }

  const analysis = await analyzeMessageForStorage(message);

  await saveMessageAnalysis({
    organizationId: context.organization.id,
    teamId: context.author.teamId,
    authorId: context.author.id,
    openedById: currentUser.id,
    message,
    analysis,
  });

  revalidatePath("/dashboard/messages");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/organization");

  return {
    status: "success",
    message:
      analysis.level === "Atencion preventiva" || analysis.level === "Riesgo alto"
        ? "Analisis guardado y alerta preventiva creada automaticamente."
        : "Analisis guardado en PostgreSQL con contenido minimizado.",
  };
}
