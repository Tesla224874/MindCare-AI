# @mindcare/analysis

Text analysis engine for MindCare.AI platform.

Includes:
- `rules-engine.ts`: Rules-based MVP for preventive signal detection (synchronous).
- `ai-engine.ts`: AI adapter for remote model calls with rules fallback (async).

## Usage

```typescript
import { analyzeMessage, analyzeMessageForStorage, getActiveAnalysisEngineName } from "@mindcare/analysis";

// Synchronous preview (uses rules engine)
const preview = analyzeMessage("I am feeling stressed");

// Async storage (uses configured engine: rules or ai)
const result = await analyzeMessageForStorage("I am feeling stressed");

// Get current engine name
const engineName = getActiveAnalysisEngineName(); // "rules" or "ai"
```

## Configuration

- `ANALYSIS_ENGINE`: Set to `"ai"` to use AI adapter, defaults to `"rules"`.
- `ANALYSIS_AI_ENDPOINT`: URL for AI analysis endpoint (required for ai engine).
- `ANALYSIS_AI_API_KEY`: Optional API key for AI endpoint.

## Building

From workspace root:
```bash
npm run build  # All packages
# or
npm --prefix packages/analysis run build
```

## Building for Production

The package exports CommonJS and ESM. Ensure your `next.config.ts` transpiles the package if needed:

```typescript
const nextConfig = {
  transpilePackages: ["@mindcare/analysis"],
};
```
