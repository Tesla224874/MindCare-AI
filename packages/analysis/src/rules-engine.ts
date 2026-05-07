import type { AnalysisEngine, AnalysisLevel } from "./types.js";

type Rule = {
  id: string;
  label: string;
  terms: string[];
  weight: number;
  recommendation: string;
  kind: "risk" | "protective";
};

const MODEL_NAME = "rules-mvp";

const rules: Rule[] = [
  {
    id: "overload",
    label: "Sobrecarga y estres",
    terms: [
      "no puedo mas",
      "demasiado trabajo",
      "agotado",
      "agotada",
      "estres",
      "presion",
      "no duermo",
      "quemado",
      "burnout",
    ],
    weight: 18,
    recommendation: "Revisar carga laboral, descanso y conversaciones de apoyo.",
    kind: "risk",
  },
  {
    id: "isolation",
    label: "Aislamiento comunicacional",
    terms: [
      "no quiero hablar",
      "nadie me escucha",
      "me siento solo",
      "me siento sola",
      "prefiero desaparecer",
      "no quiero molestar",
    ],
    weight: 20,
    recommendation: "Activar seguimiento humano cuidadoso, sin exponer al colaborador.",
    kind: "risk",
  },
  {
    id: "hopelessness",
    label: "Desesperanza o abandono",
    terms: ["no vale la pena", "me rindo", "sin salida", "todo es inutil", "no quiero seguir"],
    weight: 30,
    recommendation: "Escalar a protocolo interno de apoyo y contacto humano inmediato.",
    kind: "risk",
  },
  {
    id: "friction",
    label: "Conflicto o frustracion",
    terms: ["harto", "harta", "insoportable", "molesto", "molesta", "frustrado", "frustrada", "enojo"],
    weight: 12,
    recommendation: "Observar contexto del equipo y posibles bloqueos de gestion.",
    kind: "risk",
  },
  {
    id: "protective",
    label: "Factores protectores",
    terms: ["gracias", "apoyo", "me siento mejor", "pude descansar", "resuelto", "vamos bien", "puedo con esto"],
    weight: -10,
    recommendation: "Mantener practicas de apoyo y seguimiento preventivo.",
    kind: "protective",
  },
];

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getLevel(score: number): AnalysisLevel {
  if (score >= 70) {
    return "Riesgo alto";
  }

  if (score >= 45) {
    return "Atencion preventiva";
  }

  if (score >= 20) {
    return "Observacion";
  }

  return "Bajo";
}

export const rulesAnalysisEngine: AnalysisEngine = {
  name: MODEL_NAME,
  analyze(message) {
    const normalized = normalizeText(message);
    const words = normalized.split(/\s+/).filter(Boolean);

    const signals = rules
      .map((rule) => {
        const matches = rule.terms.filter((term) => normalized.includes(term));

        return {
          id: rule.id,
          label: rule.label,
          matches,
          score: matches.length * rule.weight,
          recommendation: rule.recommendation,
          kind: rule.kind,
        };
      })
      .filter((signal) => signal.matches.length > 0);

    const totalMatches = signals.reduce((total, signal) => total + signal.matches.length, 0);
    const rawScore = signals.reduce((total, signal) => total + signal.score, 0);
    const lengthAdjustment = words.length > 24 ? 6 : 0;
    const score = message.trim() ? clamp(rawScore + lengthAdjustment, 0, 100) : 0;
    const confidence = message.trim() ? clamp(35 + words.length * 2 + totalMatches * 8, 35, 96) : 0;

    return {
      score,
      level: getLevel(score),
      confidence,
      signals,
      totalMatches,
      disclaimer:
        "Este resultado es una simulacion preventiva, no un diagnostico clinico ni una decision automatizada.",
      modelName: MODEL_NAME,
    };
  },
};
