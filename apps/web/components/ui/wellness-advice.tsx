import { HeartPulse, ShieldCheck } from "lucide-react";

type WellnessAdviceProps = {
  aggregatedRisk: number;
  wellbeingIndex: number;
  signalLabels: string[];
};

function hasStressOrAnxietySignal(signalLabels: string[]) {
  const keywords = ["estres", "ansiedad", "agot", "presion", "sobrecarga", "cansancio", "burnout"];

  return signalLabels.some((label) => {
    const normalizedLabel = label.toLowerCase();

    return keywords.some((keyword) => normalizedLabel.includes(keyword));
  });
}

function getAdviceLevel({ aggregatedRisk, wellbeingIndex, signalLabels }: WellnessAdviceProps) {
  if (aggregatedRisk >= 60 || wellbeingIndex <= 55) {
    return "HIGH";
  }

  if (aggregatedRisk >= 35 || wellbeingIndex <= 70 || hasStressOrAnxietySignal(signalLabels)) {
    return "PREVENTIVE_ATTENTION";
  }

  return "LOW";
}

export function WellnessAdvice(props: WellnessAdviceProps) {
  const adviceLevel = getAdviceLevel(props);

  if (adviceLevel === "LOW") {
    return null;
  }

  const isHighRisk = adviceLevel === "HIGH";
  const advice = isHighRisk
    ? [
        "Haz actividad fisica suave o moderada durante 20 a 30 minutos para ayudar a reducir tension y cortisol.",
        "Prioriza dormir 7 a 8 horas y evita revisar trabajo justo antes de acostarte.",
        "Practica respiracion lenta: inhala 4 segundos, exhala 6 segundos, durante 3 a 5 minutos.",
        "Toma pausas breves lejos de la pantalla cada hora para bajar carga mental.",
        "Habla con una persona de confianza o solicita apoyo al equipo de bienestar si te sientes sobrepasado.",
      ]
    : [
        "Camina 20 a 30 minutos al dia para regular energia y estres.",
        "Ordena tus tareas por prioridad y evita sostener demasiadas urgencias a la vez.",
        "Define un cierre de jornada claro para proteger descanso y recuperacion.",
        "Haz una pausa de respiracion o estiramiento cuando notes tension fisica.",
      ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-normal text-slate-950">
            <HeartPulse className="h-5 w-5 text-teal-600" aria-hidden="true" />
            Consejos personales de bienestar
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            Recomendaciones preventivas segun tus senales agregadas. No son diagnostico clinico ni reemplazan ayuda
            profesional.
          </p>
        </div>
        <span
          className={`rounded-md px-2 py-1 text-xs font-medium ${
            isHighRisk ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          {isHighRisk ? "Prioridad alta" : "Atencion preventiva"}
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {advice.map((tip) => (
          <div key={tip} className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm leading-6 text-slate-700">{tip}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-md border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Cuando pedir apoyo
        </div>
        <p className="mt-2 text-sm leading-6 text-blue-700">
          Si la ansiedad, el estres o el agotamiento se mantienen varios dias, conversa con bienestar, tu lider o un
          profesional de salud mental.
        </p>
      </div>
    </section>
  );
}
