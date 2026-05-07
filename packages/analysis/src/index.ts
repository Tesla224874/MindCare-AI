import { aiAnalysisEngine } from "./ai-engine.js";
import { rulesAnalysisEngine } from "./rules-engine.js";
import type { AnalysisEngineName, MessageAnalysis } from "./types.js";

function getConfiguredEngineName(): AnalysisEngineName {
  return process.env.ANALYSIS_ENGINE === "ai" ? "ai" : "rules";
}

function getActiveEngine() {
  return getConfiguredEngineName() === "ai" ? aiAnalysisEngine : rulesAnalysisEngine;
}

const previewEngine = rulesAnalysisEngine;

export function analyzeMessage(message: string): MessageAnalysis {
  const analysis = previewEngine.analyze(message);

  if (analysis instanceof Promise) {
    throw new Error("The preview analysis engine must be synchronous.");
  }

  return analysis;
}

export async function analyzeMessageForStorage(message: string) {
  return getActiveEngine().analyze(message);
}

export function getActiveAnalysisEngineName() {
  return getConfiguredEngineName();
}

export { aiAnalysisEngine, rulesAnalysisEngine };
export type { AnalysisEngine, AnalysisEngineName, AnalysisLevel, MessageAnalysis, SignalResult } from "./types.js";
