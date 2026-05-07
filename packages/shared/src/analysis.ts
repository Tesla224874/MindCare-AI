/**
 * Shared analysis types and utilities
 * Bridges between AnalysisLevel (from @mindcare/analysis) and RiskLevel (from @prisma/client)
 */

// Define RiskLevel locally to avoid dependency on @prisma/client enum exports
export type RiskLevel = "LOW" | "OBSERVATION" | "PREVENTIVE_ATTENTION" | "HIGH";

// Re-export analysis types for convenience
export type AnalysisLevel = "Bajo" | "Observacion" | "Atencion preventiva" | "Riesgo alto";

export type SignalResult = {
  id: string;
  label: string;
  matches: string[];
  score: number;
  recommendation: string;
  kind: "risk" | "protective";
};

export type MessageAnalysis = {
  score: number;
  level: AnalysisLevel;
  confidence: number;
  signals: SignalResult[];
  totalMatches: number;
  disclaimer: string;
  modelName: string;
};

/**
 * Maps AnalysisLevel to RiskLevel
 */
export function mapAnalysisLevelToRiskLevel(level: AnalysisLevel): RiskLevel {
  switch (level) {
    case "Riesgo alto":
      return "HIGH";
    case "Atencion preventiva":
      return "PREVENTIVE_ATTENTION";
    case "Observacion":
      return "OBSERVATION";
    case "Bajo":
    default:
      return "LOW";
  }
}

/**
 * Maps RiskLevel to AnalysisLevel
 */
export function mapRiskLevelToAnalysisLevel(level: RiskLevel): AnalysisLevel {
  switch (level) {
    case "HIGH":
      return "Riesgo alto";
    case "PREVENTIVE_ATTENTION":
      return "Atencion preventiva";
    case "OBSERVATION":
      return "Observacion";
    case "LOW":
    default:
      return "Bajo";
  }
}

/**
 * Check if a risk level warrants alert creation
 */
export function shouldCreateAlert(level: RiskLevel): boolean {
  return level === "PREVENTIVE_ATTENTION" || level === "HIGH";
}

/**
 * Get human-readable title for alert based on risk level
 */
export function getAlertTitle(level: RiskLevel): string {
  return level === "HIGH"
    ? "Riesgo alto detectado por texto"
    : "Atencion preventiva detectada por texto";
}

/**
 * Risk level ordering for sorting/display
 */
export const riskOrder: Record<RiskLevel, number> = {
  LOW: 1,
  OBSERVATION: 2,
  PREVENTIVE_ATTENTION: 3,
  HIGH: 4,
};