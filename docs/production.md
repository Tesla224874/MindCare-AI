# Production Plan

## Completed

- MVP scope frozen.
- Basic production security started.
- Prisma initial migration created.
- Production environment check added.
- Workspace root prepared.
- Web app moved to `apps/web`.
- Prisma schema and migrations moved to `packages/database`.
- Analysis engine moved to `packages/analysis` (rules-mvp + AI adapter).
- Shared types and utilities moved to `packages/shared`.
- GitHub Actions production pipeline added.

## Next Steps

1. Choose production PostgreSQL provider.
2. Configure Vercel project and secrets.
3. Run production migrations.
4. Create the first production admin user.

## Deployment Baseline

Before deployment, run:

```powershell
npm.cmd run test
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run web:build
npm.cmd run prod:check
```

## GitHub Actions

The workflow in `.github/workflows/deploy.yml` validates every pull request and
push to `main`.

Validation runs:

```powershell
npm.cmd ci
npm.cmd run packages:build
npm.cmd run test
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run prod:check
npm.cmd run web:build
```

Deployment is manual for now. Open GitHub Actions, run `Production Pipeline`,
and enable `deploy_production` only when the production database and Vercel
secrets are ready.

Required GitHub repository secrets:

```text
DATABASE_URL
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

Required Vercel environment variables:

```text
DATABASE_URL
AUTH_SECRET
ANALYSIS_ENGINE
ANALYSIS_AI_ENDPOINT
ANALYSIS_AI_API_KEY
```
