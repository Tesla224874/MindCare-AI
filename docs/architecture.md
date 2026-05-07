# Architecture

## Current Architecture

The MVP is now a modular Next.js full-stack application with extracted packages:

- UI: `apps/web/app` and `apps/web/components`
- Server Actions and route handlers: `apps/web/app`
- Domain/data access: `apps/web/lib`
- Prisma schema and migrations: `packages/database/prisma`
- Database seed runtime: `apps/web/prisma/seed.mjs`
- Analysis engine: `packages/analysis/src` (imported as `@mindcare/analysis`)
- Shared utilities: `packages/shared/src` (imported as `@mindcare/shared`)

This keeps database, analysis, and shared utilities contracts outside the web app
while allowing efficient module resolution and dependency management.

## Production Target

The intended structure is:

```text
apps/web
packages/database
packages/analysis
packages/shared
docs
```

Responsibilities:

- `apps/web`: Next.js routes, UI, Server Actions, auth proxy.
- `packages/database`: Prisma schema, migrations, and bootstrap SQL.
- `packages/analysis`: text analysis contract, rules engine, AI adapter.
- `packages/shared`: shared types and validation utilities.

## Migration Principles

- Move one boundary at a time.
- Keep the application compiling after each phase.
- Keep production migration scripts working.
- Keep the application compiling after each package split.
