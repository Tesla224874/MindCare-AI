# @mindcare/shared

Shared types, constants, and validation utilities for MindCare.AI packages.

## Modules

### `auth`
Authentication types and session configuration:
- `SessionRole` - User roles in session context
- `SessionPayload` - Session token structure
- Constants: `SESSION_COOKIE`, `SESSION_TTL_SECONDS`, `DEMO_EMAIL`, `DEMO_PASSWORD`

### `roles`
Authorization and role utilities:
- `AppRole` - Application user roles
- `roleLabels` - Human-readable role names
- `roleDescriptions` - Role permission descriptions

### `analysis`
Analysis engine types and risk level mapping:
- `AnalysisLevel` - Analysis result levels
- `SignalResult` - Detection signal structure
- `MessageAnalysis` - Complete analysis result
- `mapAnalysisLevelToRiskLevel()` - Convert AnalysisLevel → RiskLevel
- `mapRiskLevelToAnalysisLevel()` - Convert RiskLevel → AnalysisLevel
- `shouldCreateAlert()` - Check if level warrants alert
- `getAlertTitle()` - Human-readable alert title
- `riskOrder` - Risk level display order

## Usage

```typescript
import {
  SessionPayload,
  AppRole,
  roleLabels,
  mapAnalysisLevelToRiskLevel,
  shouldCreateAlert,
} from "@mindcare/shared";

import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  DEMO_EMAIL,
} from "@mindcare/shared/auth";

import {
  roleDescriptions,
} from "@mindcare/shared/roles";

import {
  mapRiskLevelToAnalysisLevel,
} from "@mindcare/shared/analysis";
```

## Building

From workspace root:
```bash
npm run build  # All packages including shared
# or
npm --prefix packages/shared run build
```

## Dependencies

- `@prisma/client` - For Prisma types (RiskLevel, etc.)
- `typescript` - For build and type definitions
