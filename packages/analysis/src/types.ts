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

export type AnalysisEngine = {
  name: string;
  analyze(message: string): MessageAnalysis | Promise<MessageAnalysis>;
};

export type AnalysisEngineName = "rules" | "ai";
