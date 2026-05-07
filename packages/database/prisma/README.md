# Base de Datos

Este proyecto usa PostgreSQL con Prisma.

## 1. Crear usuario y base

Ejecuta desde la raiz del workspace:

```powershell
npm.cmd run db:init
```

Si tu usuario administrador de PostgreSQL no es `postgres`, ejecuta manualmente:

```powershell
psql -U TU_USUARIO_ADMIN -f packages/database/prisma/init-db.sql
```

## 2. Crear `.env`

Copia `.env.example` a `.env` y conserva:

```env
DATABASE_URL="postgresql://mindcare:mindcare@localhost:5432/mindcare_ai?schema=public"
AUTH_SECRET="replace-with-a-long-random-secret-at-least-32-characters"
```

## 3. Crear tablas y datos demo en local

```powershell
npm.cmd run db:setup
```

Eso ejecuta:

```powershell
npm.cmd run db:push
npm.cmd run db:seed
```

Para desarrollo local rapido, `db:push` esta bien. Para produccion usa migraciones.

## 4. Migraciones para produccion

El proyecto incluye una migracion inicial en:

```text
packages/database/prisma/migrations/20260506190000_init/migration.sql
```

En produccion se debe aplicar con:

```powershell
npm.cmd run db:deploy
```

Para revisar el estado de migraciones:

```powershell
npm.cmd run db:status
```

Cuando cambies `schema.prisma` durante desarrollo, crea una nueva migracion con:

```powershell
npm.cmd run db:migrate -- --name nombre_del_cambio
```

Si tu usuario local no puede crear la shadow database de Prisma, puedes seguir usando `db:push` en local y generar SQL con `prisma migrate diff`, pero para produccion deben existir archivos en `packages/database/prisma/migrations`.

## 5. Abrir Prisma Studio

```powershell
npm.cmd run db:studio
```

## Nota de seguridad

El usuario `mindcare` y la clave `mindcare` son solo para desarrollo local.
Antes de produccion se deben usar secretos fuertes, SSL, backups y roles con permisos minimos.
