# MindCare.AI Workspace

MindCare.AI is being prepared for production as a full-stack product workspace.

The current application lives in `apps/web/`. It contains the Next.js UI, Server Actions, Prisma configuration, authentication, authorization, audit logs. The database schema and migrations live in `packages/database`. The text analysis engine (rules MVP and AI adapter) live in `packages/analysis`. Shared types and utilities live in `packages/shared`.

## Current Layout

```text
MindCare-AI/
  package.json        # workspace/orchestration scripts
  README.md           # production workspace overview
  docs/               # architecture and production notes
  apps/
    web/              # Next.js app with UI and Server Actions
  packages/
    database/         # Prisma schema, migrations, bootstrap SQL
    analysis/         # rules engine, AI adapter, future model clients
    shared/           # shared types, constants, utilities
```

## Target Layout

```text
MindCare-AI/
  apps/
    web/              # Next.js app
  packages/
    database/         # Prisma schema, migrations, bootstrap SQL
    analysis/         # rules engine, AI adapter, future model clients
    shared/           # shared types and utilities
  docs/
```

## Root Commands

```powershell
npm.cmd run web:dev
npm.cmd run test
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run web:build
npm.cmd run prod:check
```

Prisma schema and migrations live in `packages/database`. The analysis engine
lives in `packages/analysis`. Shared types and utilities live in `packages/shared`
and are consumed by all packages.
