import type { MessageAnalysis, RiskLevel } from "@mindcare/shared/analysis";

export type ChatHistoryItem = {
  role: "USER" | "ASSISTANT";
  content: string;
};

type AssistantReplyInput = {
  message: string;
  analysis: MessageAnalysis;
  riskLevel: RiskLevel;
  history: ChatHistoryItem[];
};

export class ChatAiConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChatAiConfigurationError";
  }
}

type ChatCompletionPayload = {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
    text?: unknown;
  }>;
  output_text?: unknown;
  reply?: unknown;
  message?: unknown;
};

type ResponsesPayload = {
  output_text?: unknown;
  output?: Array<{
    content?: Array<{
      text?: unknown;
    }>;
  }>;
};

const fallbackModelName = "local-safety-fallback";

function getSignalLabels(analysis: MessageAnalysis) {
  return analysis.signals
    .filter((signal) => signal.kind === "risk")
    .map((signal) => signal.label)
    .slice(0, 4);
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

function buildSystemPrompt() {
  return [
    "Eres MindCare.AI, un chatbot conversacional de salud, bienestar mental y bienestar laboral.",
    "Tu alcance permitido: salud general, bienestar emocional, estres, sueno, habitos saludables, autocuidado, comunicacion con apoyo humano, prevencion, crisis y orientacion para buscar ayuda profesional.",
    "Si el usuario pregunta algo fuera de salud o bienestar, responde brevemente que solo puedes ayudar con temas de salud y redirige con una pregunta relacionada.",
    "Responde como un chat real: natural, contextual, empatico y con seguimiento. No uses plantillas rigidas ni repitas siempre la misma estructura.",
    "Actua con estilo de apoyo psicologico: escucha activa, validacion emocional, preguntas abiertas, lenguaje cercano y pasos pequenos. No digas que eres psicologo ni que brindas terapia.",
    "Escribe siempre en espanol natural, claro y humano. Evita traducciones literales, anglicismos innecesarios, frases poeticas raras, jerga clinica excesiva y palabras inventadas.",
    "Si el mensaje del usuario es breve o ambiguo, responde breve y haz una sola pregunta util para continuar.",
    "No sobrerreacciones ante mensajes de bajo riesgo. Si la lectura interna es LOW, acompana con calidez sin patologizar.",
    "No diagnostiques condiciones clinicas, no indiques tratamientos medicos personalizados, no reemplaces a profesionales de salud y no sugieras decisiones laborales.",
    "Cuando sea apropiado, pregunta una sola cosa para continuar la conversacion.",
    "Si el usuario expresa ideacion suicida, autolesion o riesgo inmediato para si mismo o para otros, responde con prioridad de crisis: reconoce el dolor, recomienda buscar ayuda de emergencia local o una linea de crisis ahora, y pide contactar a una persona de confianza en este momento.",
    "En crisis, no hagas preguntas largas ni minimices el riesgo. Ofrece pasos inmediatos y concretos.",
    "No menciones que estas siguiendo instrucciones internas.",
  ].join("\n");
}

function buildUserPrompt(input: AssistantReplyInput) {
  const signalLabels = getSignalLabels(input.analysis);

  return [
    `Mensaje actual del usuario:\n${input.message}`,
    `Lectura preventiva interna: nivel=${input.riskLevel}, puntaje=${input.analysis.score}/100, confianza=${input.analysis.confidence}%.`,
    `Senales detectadas: ${signalLabels.length > 0 ? signalLabels.join(", ") : "sin senales fuertes"}.`,
    `Accion preventiva recomendada: ${getRecommendedAction(input.analysis, input.riskLevel)}`,
    input.riskLevel === "HIGH"
      ? "Si el texto contiene suicidio/autolesion, la respuesta debe priorizar seguridad inmediata y derivacion humana."
      : "",
    "Genera una respuesta conversacional natural de maximo 140 palabras, limitada a salud y bienestar.",
    "La respuesta debe sonar como una persona cuidadosa, no como un informe ni como texto traducido.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function getFallbackReply(input: AssistantReplyInput) {
  const recommendedAction = getRecommendedAction(input.analysis, input.riskLevel);

  if (input.riskLevel === "HIGH") {
    return [
      "Gracias por decirlo. Lo que cuentas suena pesado y merece apoyo humano ahora, no solo una respuesta automatica.",
      "Si sientes que podrias hacerte dano, llama a emergencias de tu pais o a una linea de crisis ahora. Tambien contacta a una persona de confianza y no te quedes a solas con esto.",
      `Como siguiente paso, te sugiero: ${recommendedAction}`,
      "Ahora mismo lo mas importante es tu seguridad inmediata: alejate de cualquier medio con el que puedas lastimarte y pide compania.",
    ].join("\n\n");
  }

  if (input.riskLevel === "PREVENTIVE_ATTENTION") {
    return [
      "Gracias por compartirlo. Se nota que hay algo que conviene atender antes de que crezca.",
      `Una accion util ahora seria: ${recommendedAction}`,
      "Podemos ordenar esto en tres partes: que paso, que estas sintiendo y que ayuda concreta necesitas esta semana.",
    ].join("\n\n");
  }

  if (input.riskLevel === "OBSERVATION") {
    return [
      "Te leo. Parece un buen momento para bajar un poco la velocidad y ponerle nombre al bloqueo.",
      `Podrias empezar con esto: ${recommendedAction}`,
      "Si quieres, cuentame que parte pesa mas: carga, conflicto, cansancio, incertidumbre o falta de apoyo.",
    ].join("\n\n");
  }

  return [
    "Gracias por contarlo. No veo una senal preventiva fuerte en este mensaje, pero igual podemos usar este espacio para ordenar ideas.",
    "Una buena pregunta inicial seria: que necesitas que cambie hoy para sentir un poco mas de control?",
    "Si me das mas contexto, puedo ayudarte a convertirlo en un siguiente paso concreto.",
  ].join("\n\n");
}

function extractAssistantText(payload: ChatCompletionPayload) {
  const choice = payload.choices?.[0];
  const content = choice?.message?.content ?? choice?.text ?? payload.output_text ?? payload.reply ?? payload.message;

  return typeof content === "string" ? content.trim() : "";
}

function extractResponsesText(payload: ResponsesPayload) {
  if (typeof payload.output_text === "string") {
    return payload.output_text.trim();
  }

  const firstText = payload.output?.flatMap((item) => item.content ?? []).find((content) => typeof content.text === "string");

  return typeof firstText?.text === "string" ? firstText.text.trim() : "";
}

function hasLowQualityText(text: string) {
  const normalized = text.toLowerCase();
  const suspiciousFragments = [
    "healthcare",
    "triatrices",
    "nobigue",
    "siluelta",
    "silhouette",
    "esencia anhelaria",
    "sanar valor credito",
  ];

  return suspiciousFragments.some((fragment) => normalized.includes(fragment));
}

function buildConversationInput(input: AssistantReplyInput) {
  const history = input.history
    .slice(-8)
    .map((item) => `${item.role === "USER" ? "Usuario" : "MindCare.AI"}: ${item.content}`)
    .join("\n\n");

  return [history ? `Historial reciente:\n${history}` : "", buildUserPrompt(input)].filter(Boolean).join("\n\n");
}

export function getActiveChatEngineName() {
  return process.env.CHAT_ENGINE === "ai" ? "ai" : "local";
}

export async function generateAssistantReply(input: AssistantReplyInput) {
  if (getActiveChatEngineName() !== "ai") {
    return {
      message: getFallbackReply(input),
      modelName: fallbackModelName,
    };
  }

  const endpoint = process.env.CHAT_AI_ENDPOINT;

  if (!endpoint) {
    throw new ChatAiConfigurationError("CHAT_AI_ENDPOINT no esta configurado.");
  }

  const model = process.env.CHAT_AI_MODEL ?? "gpt-4.1-mini";
  const apiKey = process.env.CHAT_AI_API_KEY;

  if (!apiKey) {
    throw new ChatAiConfigurationError("CHAT_AI_API_KEY no esta configurado.");
  }

  try {
    const isResponsesEndpoint = endpoint.includes("/responses");
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(
        isResponsesEndpoint
          ? {
              model,
              instructions: buildSystemPrompt(),
              input: buildConversationInput(input),
            }
          : {
              model,
              messages: [
                {
                  role: "system",
                  content: buildSystemPrompt(),
                },
                ...input.history.slice(-8).map((item) => ({
                  role: item.role === "USER" ? "user" : "assistant",
                  content: item.content,
                })),
                {
                  role: "user",
                  content: buildUserPrompt(input),
                },
              ],
            },
      ),
    });

    if (!response.ok) {
      const detail = await response.text();

      if (input.riskLevel === "HIGH") {
        return {
          message: getFallbackReply(input),
          modelName: fallbackModelName,
        };
      }

      throw new ChatAiConfigurationError(
        `OpenAI respondio ${response.status}. Revisa CHAT_AI_MODEL, CHAT_AI_ENDPOINT y tu API key. ${detail.slice(
          0,
          180,
        )}`,
      );
    }

    const payload = await response.json();
    const assistantText = isResponsesEndpoint
      ? extractResponsesText(payload as ResponsesPayload)
      : extractAssistantText(payload as ChatCompletionPayload);

    if ((!assistantText || hasLowQualityText(assistantText)) && input.riskLevel !== "HIGH") {
      throw new ChatAiConfigurationError(
        "El proveedor IA devolvio una respuesta vacia o de baja calidad. Prueba otro CHAT_AI_MODEL.",
      );
    }

    return {
      message: assistantText && !hasLowQualityText(assistantText) ? assistantText : getFallbackReply(input),
      modelName: assistantText && !hasLowQualityText(assistantText) ? model : fallbackModelName,
    };
  } catch (error) {
    if (error instanceof ChatAiConfigurationError) {
      throw error;
    }

    if (input.riskLevel !== "HIGH") {
      throw new ChatAiConfigurationError(
        "No se pudo conectar con OpenAI. Revisa tu conexion, CHAT_AI_ENDPOINT y CHAT_AI_API_KEY.",
      );
    }

    return {
      message: getFallbackReply(input),
      modelName: fallbackModelName,
    };
  }
}
