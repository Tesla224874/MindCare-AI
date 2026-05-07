import test from "node:test";
import assert from "node:assert/strict";
import { rulesAnalysisEngine } from "../lib/analysis/rules-engine.ts";

test("detects preventive attention from overload text", async () => {
  const analysis = await rulesAnalysisEngine.analyze("Estoy agotado, siento demasiada presion y no duermo bien.");

  assert.equal(analysis.modelName, "rules-mvp");
  assert.equal(analysis.level, "Atencion preventiva");
  assert.ok(analysis.score >= 45);
  assert.ok(analysis.signals.some((signal) => signal.id === "overload"));
});

test("keeps neutral text as low risk", async () => {
  const analysis = await rulesAnalysisEngine.analyze("Gracias por el apoyo, pude descansar y vamos bien con el equipo.");

  assert.equal(analysis.level, "Bajo");
  assert.ok(analysis.score <= 10);
  assert.ok(analysis.signals.some((signal) => signal.kind === "protective"));
});

test("escalates high risk language", async () => {
  const analysis = await rulesAnalysisEngine.analyze(
    "No vale la pena, me rindo, no quiero seguir, no puedo mas y me siento solo.",
  );

  assert.equal(analysis.level, "Riesgo alto");
  assert.ok(analysis.score >= 70);
  assert.ok(analysis.signals.some((signal) => signal.id === "hopelessness"));
});
