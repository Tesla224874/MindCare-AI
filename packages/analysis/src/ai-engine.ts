import { rulesAnalysisEngine } from "./rules-engine.js";
import type { AnalysisEngine, AnalysisLevel, MessageAnalysis, SignalResult } from "./types.js";

const MODEL_NAME = "ai-adapter";
const FALLBACK_MODEL_NAME = "ai-adapter-fallback-rules";

const validLevels = new Set<AnalysisLevel>(["Bajo", "Observacion", "Atencion preventiva", "Riesgo alto"]);

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isSignal(value: unknown): value is SignalResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const signal = value as Partial<SignalResult>;

  return (
    typeof signal.id === "string" &&
    typeof signal.label === "string" &&
    Array.isArray(signal.matches) &&
    typeof signal.score === "number" &&
    typeof signal.recommendation === "string" &&
    (signal.kind === "risk" || signal.kind === "protective")
  );
}

function normalizeAiAnalysis(value: unknown): MessageAnalysis | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<MessageAnalysis>;
  const signals = Array.isArray(candidate.signals) ? candidate.signals.filter(isSignal) : [];

  if (
    typeof candidate.score !== "number" ||
    typeof candidate.level !== "string" ||
    !validLevels.has(candidate.level as AnalysisLevel) ||
    typeof candidate.confidence !== "number"
  ) {
    return null;
  }

  return {
    score: clamp(Math.round(candidate.score), 0, 100),
    level: candidate.level as AnalysisLevel,
    confidence: clamp(Math.round(candidate.confidence), 0, 100),
    signals,
    totalMatches:
      typeof candidate.totalMatches === "number"
        ? Math.max(0, Math.round(candidate.totalMatches))
        : signals.reduce((total, signal) => total + signal.matches.length, 0),
    disclaimer:
      typeof candidate.disclaimer === "string"
        ? candidate.disclaimer
        : "Resultado preventivo asistido por IA. No es diagnostico clinico ni decision automatizada.",
    modelName: typeof candidate.modelName === "string" ? candidate.modelName : MODEL_NAME,
  };
}

async function fallbackToRules(message: string): Promise<MessageAnalysis> {
  const fallback = await rulesAnalysisEngine.analyze(message);

  return {
    ...fallback,
    modelName: FALLBACK_MODEL_NAME,
  };
}

export const aiAnalysisEngine: AnalysisEngine = {
  name: MODEL_NAME,
  async analyze(message) {
    const endpoint = process.env.ANALYSIS_AI_ENDPOINT;
    const apiKey = process.env.ANALYSIS_AI_API_KEY;

    if (!endpoint) {
      return fallbackToRules(message);
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
          task: "mindcare.text.preventive_analysis",
          language: "es",
          text: message,
          outputContract: {
            score: "number 0-100",
            level: ["Bajo", "Observacion", "Atencion preventiva", "Riesgo alto"],
            confidence: "number 0-100",
            signals: "array of { id, label, matches, score, recommendation, kind }",
            totalMatches: "number",
            disclaimer: "string",
            modelName: "string",
          },
          safetyBoundary:
            "Return preventive wellbeing signals only. Do not diagnose mental illness or make employment decisions.",
        }),
      });

      if (!response.ok) {
        return fallbackToRules(message);
      }

      const payload = normalizeAiAnalysis(await response.json());

      return payload ?? fallbackToRules(message);
    } catch {
      return fallbackToRules(message);
    }
  },
};
