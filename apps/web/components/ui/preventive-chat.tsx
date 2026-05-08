"use client";

import { startTransition, useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bot, MessageSquarePlus, Send, ShieldCheck } from "lucide-react";
import type { ChatActionState, NewChatActionState } from "@/app/(dashboard)/dashboard/chat/actions";

type ChatMessageItem = {
  id: string;
  role: "USER" | "ASSISTANT";
  preview: string;
  createdAt: string;
  analysis?: {
    score: number;
    level: string;
    confidence: number;
    alertId: string | null;
  } | null;
};

type PreventiveChatProps = {
  intro: string;
  messages: ChatMessageItem[];
  action: (previousState: ChatActionState, formData: FormData) => Promise<ChatActionState>;
  newChatAction: (previousState: NewChatActionState, formData: FormData) => Promise<NewChatActionState>;
};

const initialState: ChatActionState = {
  status: "idle",
  message: "",
  requestId: 0,
};

const initialNewChatState: NewChatActionState = {
  status: "idle",
  message: "",
  requestId: 0,
};

const levelLabels: Record<string, string> = {
  LOW: "Bajo",
  OBSERVATION: "Observacion",
  PREVENTIVE_ATTENTION: "Atencion preventiva",
  HIGH: "Riesgo alto",
};

function getLevelTone(level?: string) {
  if (level === "HIGH") {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }

  if (level === "PREVENTIVE_ATTENTION") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (level === "OBSERVATION") {
    return "border-sky-200 bg-sky-50 text-sky-800";
  }

  return "border-teal-200 bg-teal-50 text-teal-800";
}

function StateMessage({ state }: { state: ChatActionState | NewChatActionState }) {
  if (state.status === "idle") {
    return null;
  }

  return (
    <p
      className={`rounded-md border px-3 py-2 text-sm ${
        state.status === "success"
          ? "border-teal-200 bg-teal-50 text-teal-800"
          : "border-rose-200 bg-rose-50 text-rose-800"
      }`}
    >
      {state.message}
    </p>
  );
}

export function PreventiveChat({ intro, messages, action, newChatAction }: PreventiveChatProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [newChatState, newChatFormAction, isNewChatPending] = useActionState(newChatAction, initialNewChatState);
  const [message, setMessage] = useState("");
  const [lastResetRequestId, setLastResetRequestId] = useState(0);
  const router = useRouter();
  const canSend = message.trim().length >= 4 && message.length <= 1500;

  const visibleMessages = useMemo(
    () => {
      const hasSubmittedMessage =
        state.status === "success" &&
        state.requestId > lastResetRequestId &&
        state.submittedMessage &&
        messages.some((item) => item.role === "USER" && item.preview === state.submittedMessage);
      const hasAssistantMessage =
        state.status === "success" &&
        state.requestId > lastResetRequestId &&
        state.assistantMessage &&
        messages.some((item) => item.role === "ASSISTANT" && item.preview === state.assistantMessage);
      const optimisticMessages: ChatMessageItem[] = [];

      if (
        state.status === "success" &&
        state.requestId > lastResetRequestId &&
        state.submittedMessage &&
        !hasSubmittedMessage
      ) {
        optimisticMessages.push({
          id: "submitted-message",
          role: "USER",
          preview: state.submittedMessage,
          createdAt: "Ahora",
          analysis:
            state.riskLevel && state.score !== undefined
              ? {
                  score: state.score,
                  level: state.riskLevel,
                  confidence: 0,
                  alertId: state.alertCreated ? "pending" : null,
                }
              : null,
        });
      }

      if (
        state.status === "success" &&
        state.requestId > lastResetRequestId &&
        state.assistantMessage &&
        !hasAssistantMessage
      ) {
        optimisticMessages.push({
          id: "assistant-message",
          role: "ASSISTANT",
          preview: state.assistantMessage,
          createdAt: "Ahora",
          analysis: null,
        });
      }

      return [
      {
        id: "intro",
        role: "ASSISTANT" as const,
        preview: intro,
        createdAt: "Ahora",
        analysis: null,
      },
      ...messages,
      ...optimisticMessages,
    ];
    },
    [
      intro,
      lastResetRequestId,
      messages,
      state.alertCreated,
      state.assistantMessage,
      state.requestId,
      state.riskLevel,
      state.score,
      state.status,
      state.submittedMessage,
    ],
  );

  function submitMessage() {
    const trimmedMessage = message.trim();

    if (trimmedMessage.length < 4 || trimmedMessage.length > 1500 || isPending) {
      return;
    }

    const formData = new FormData();
    formData.set("message", trimmedMessage);
    setMessage("");

    startTransition(() => {
      formAction(formData);
    });
  }

  useEffect(() => {
    if (state.status !== "idle") {
      router.refresh();
    }
  }, [router, state.status, state.message]);

  useEffect(() => {
    if (newChatState.status !== "idle") {
      router.refresh();
    }
  }, [newChatState.requestId, newChatState.status, router]);

  function submitNewChat() {
    if (isPending || isNewChatPending) {
      return;
    }

    setLastResetRequestId(state.requestId);
    setMessage("");

    startTransition(() => {
      newChatFormAction(new FormData());
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-normal">Conversacion preventiva</h2>
            <p className="mt-1 text-sm text-slate-500">Chat dinamico con privacidad y revision humana.</p>
          </div>
          <Bot className="h-5 w-5 text-blue-600" aria-hidden="true" />
        </div>

        <div className="mt-5 max-h-[560px] space-y-3 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4">
          {visibleMessages.map((item) => {
            const isAssistant = item.role === "ASSISTANT";

            return (
              <article
                key={item.id}
                className={`max-w-[92%] rounded-lg border p-4 ${
                  isAssistant
                    ? "border-slate-200 bg-white text-slate-700"
                    : "ml-auto border-blue-200 bg-blue-50 text-blue-900"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium uppercase text-slate-500">
                    {isAssistant ? "MindCare.AI" : "Tu mensaje"}
                  </p>
                  <p className="text-xs text-slate-400">{item.createdAt}</p>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm leading-6">{item.preview}</p>
                {item.analysis ? (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className={`rounded-md border px-2 py-1 ${getLevelTone(item.analysis.level)}`}>
                      {levelLabels[item.analysis.level] ?? item.analysis.level} - {item.analysis.score}/100
                    </span>
                    <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-500">
                      Confianza {item.analysis.confidence}%
                    </span>
                    {item.analysis.alertId ? (
                      <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-amber-700">
                        Alerta creada
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700" htmlFor="chat-message">
            Mensaje
          </label>
          <textarea
            id="chat-message"
            name="message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submitMessage();
              }
            }}
            className="mt-2 min-h-32 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white"
            placeholder="Escribe como te sientes o que necesitas ordenar..."
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>{message.length}/1500 caracteres</span>
            <span>El chat guarda contenido minimizado y genera alertas solo si hay senales elevadas.</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={submitMessage}
              disabled={isPending || !canSend}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              {isPending ? "Enviando..." : "Enviar"}
            </button>
            <button
              type="button"
              onClick={submitNewChat}
              disabled={isPending || isNewChatPending}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
              {isNewChatPending ? "Iniciando..." : "Comenzar nuevo chat"}
            </button>
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <StateMessage state={state} />
        <StateMessage state={newChatState} />

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
            <ShieldCheck className="h-4 w-4 text-teal-600" aria-hidden="true" />
            Limites del asistente
          </div>
          <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
            <p>No entrega diagnosticos clinicos ni decisiones laborales.</p>
            <p>Cuando detecta riesgo elevado, abre una alerta preventiva para revision humana.</p>
            <p>El mensaje del usuario se almacena como hash y vista minimizada para reducir exposicion.</p>
          </div>
        </section>

        <section className={`rounded-lg border p-5 ${getLevelTone(state.riskLevel)}`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium opacity-80">Ultima lectura</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-normal">
                {state.riskLevel ? levelLabels[state.riskLevel] ?? state.riskLevel : "Sin mensaje nuevo"}
              </h2>
            </div>
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="mt-3 text-sm leading-6 opacity-80">
            {state.score !== undefined
              ? `Puntaje preventivo ${state.score}/100.`
              : "Envia un mensaje para ver la lectura preventiva de esta conversacion."}
          </p>
        </section>
      </aside>
    </div>
  );
}
