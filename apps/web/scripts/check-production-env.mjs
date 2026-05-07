import process from "node:process";

try {
  process.loadEnvFile(".env");
} catch {
  // Production providers usually inject env vars without a local .env file.
}

const insecureSecrets = new Set([
  "replace-with-a-long-random-secret",
  "replace-with-a-long-random-secret-at-least-32-characters",
  "mindcare-ai-local-demo-secret",
]);

const required = ["DATABASE_URL", "AUTH_SECRET"];
const missing = required.filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

const authSecret = process.env.AUTH_SECRET ?? "";

if (authSecret.length < 32 || insecureSecrets.has(authSecret)) {
  console.error("AUTH_SECRET must be a strong secret with at least 32 characters.");
  process.exit(1);
}

if (!process.env.DATABASE_URL?.startsWith("postgresql://") && !process.env.DATABASE_URL?.startsWith("postgres://")) {
  console.error("DATABASE_URL must be a PostgreSQL connection string.");
  process.exit(1);
}

const engine = process.env.ANALYSIS_ENGINE ?? "rules";

if (!["rules", "ai"].includes(engine)) {
  console.error('ANALYSIS_ENGINE must be "rules" or "ai".');
  process.exit(1);
}

if (engine === "ai" && !process.env.ANALYSIS_AI_ENDPOINT) {
  console.error('ANALYSIS_AI_ENDPOINT is required when ANALYSIS_ENGINE="ai".');
  process.exit(1);
}

console.log("Production environment check passed.");
