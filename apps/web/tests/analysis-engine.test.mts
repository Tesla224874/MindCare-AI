import test from "node:test";
import assert from "node:assert/strict";
import { aiAnalysisEngine, analyzeMessageForStorage, getActiveAnalysisEngineName } from "../lib/analysis/index.ts";

test("uses rules engine by default", async () => {
  const previousEngine = process.env.ANALYSIS_ENGINE;
  delete process.env.ANALYSIS_ENGINE;

  const analysis = await analyzeMessageForStorage("Estoy agotado y siento demasiada presion.");

  assert.equal(getActiveAnalysisEngineName(), "rules");
  assert.equal(analysis.modelName, "rules-mvp");

  process.env.ANALYSIS_ENGINE = previousEngine;
});

test("ai engine falls back to rules when endpoint is not configured", async () => {
  const previousEndpoint = process.env.ANALYSIS_AI_ENDPOINT;
  delete process.env.ANALYSIS_AI_ENDPOINT;

  const analysis = await aiAnalysisEngine.analyze("Estoy agotado y siento demasiada presion.");

  assert.equal(analysis.modelName, "ai-adapter-fallback-rules");
  assert.ok(analysis.score > 0);

  process.env.ANALYSIS_AI_ENDPOINT = previousEndpoint;
});
