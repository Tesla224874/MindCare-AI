# @mindcare/database

Database package for MindCare.AI.

## Contents

- `prisma/schema.prisma`: application data model.
- `prisma/migrations`: production migration history.
- `prisma/init-db.sql`: local PostgreSQL database/user bootstrap.

The web app still runs Prisma commands from `apps/web` because `@prisma/client`,
the Prisma CLI, and the database seed runtime are installed there today. The
Prisma config in `apps/web/prisma.config.ts` points back to this package.

## Local Commands

From the workspace root:

```powershell
npm.cmd run db:init
npm.cmd run db:push
npm.cmd run db:seed
```

For production deployments:

```powershell
npm.cmd run db:deploy
```
