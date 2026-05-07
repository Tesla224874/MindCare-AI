# MindCare.AI

MindCare.AI es un MVP de bienestar organizacional preventivo. La aplicacion ayuda a organizaciones a revisar senales agregadas de bienestar, analizar textos laborales autorizados, gestionar consentimientos y dar seguimiento humano a alertas preventivas.

> Nota de estructura: esta app ya vive en `apps/web` dentro del workspace de produccion. El schema y las migraciones de Prisma viven en `../../packages/database`; la siguiente fase separara el motor de analisis.

Importante: el sistema no entrega diagnosticos clinicos ni debe usarse para sanciones laborales. Las alertas son senales preventivas para orientar apoyo humano.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Prisma 7
- PostgreSQL

## Modulos actuales

- Login con usuarios reales de PostgreSQL.
- Sesion con cookie firmada.
- Roles y permisos: `ADMIN`, `WELLBEING`, `TEAM_LEAD`, `AUDITOR`, `EMPLOYEE`.
- Dashboard con metricas reales desde PostgreSQL.
- Analizador de texto MVP basado en reglas.
- Alertas preventivas automaticas.
- Gestion de alertas.
- Organizacion: crear equipos y usuarios.
- Privacidad: gestionar consentimientos.
- Auditoria de acciones sensibles.

## Requisitos

- Node.js compatible con Next.js 16.
- PostgreSQL local instalado y ejecutandose.
- npm.

En Windows, si `npm` esta bloqueado por PowerShell, usa `npm.cmd`.

## Variables de entorno

Crea `.env` desde `.env.example`:

```env
DATABASE_URL="postgresql://mindcare:mindcare@localhost:5432/mindcare_ai?schema=public"
AUTH_SECRET="replace-with-a-long-random-secret-at-least-32-characters"
ANALYSIS_ENGINE="rules"
ANALYSIS_AI_ENDPOINT=""
ANALYSIS_AI_API_KEY=""
```

Para desarrollo local esa clave sirve. Antes de produccion debe reemplazarse por un secreto largo y aleatorio de al menos 32 caracteres.

Antes de desplegar puedes validar variables criticas con:

```powershell
npm.cmd run prod:check
```

## Base de datos local

Si `psql` esta en PATH:

```powershell
npm.cmd run db:init
```

Si no esta en PATH, en PostgreSQL 18 para Windows puedes ejecutar:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -f ..\..\packages\database\prisma\init-db.sql
```

Luego crea tablas y datos demo:

```powershell
npm.cmd run db:push
npm.cmd run db:seed
```

Tambien puedes abrir Prisma Studio:

```powershell
npm.cmd run db:studio
```

Mas detalle en `../../packages/database/prisma/README.md`.

Para produccion, aplica el schema con migraciones:

```powershell
npm.cmd run db:deploy
```

## Ejecutar en local

```powershell
npm.cmd run dev
```

Abre:

```text
http://localhost:3000
```

Si Next indica que ya hay otro servidor corriendo, mata el proceso con el PID indicado:

```powershell
taskkill /PID NUMERO /F
```

## Credenciales demo

```text
admin@empresa.com / MindCareDemo2026
ana.rivera@empresa.com / MindCareAna2026
marco.vega@empresa.com / MindCareMarco2026
lucia.torres@empresa.com / MindCareLucia2026
```

## Scripts utiles

```powershell
npm.cmd run dev
npm.cmd run lint
npm.cmd test
npm.cmd run prod:check
npx.cmd tsc --noEmit
npm.cmd run build
npm.cmd run db:push
npm.cmd run db:deploy
npm.cmd run db:status
npm.cmd run db:seed
```

## Motor de analisis

Por defecto el proyecto usa:

```env
ANALYSIS_ENGINE="rules"
```

Ese motor es local, explicable y no llama servicios externos.

Para preparar IA real:

```env
ANALYSIS_ENGINE="ai"
ANALYSIS_AI_ENDPOINT="https://tu-servicio/analysis"
ANALYSIS_AI_API_KEY="tu-api-key"
```

El adaptador de IA espera una respuesta JSON con `score`, `level`, `confidence`, `signals`, `totalMatches`, `disclaimer` y `modelName`. Si el endpoint falla o no esta configurado, el sistema vuelve automaticamente a `rules-mvp`.

## Flujo recomendado de prueba

1. Iniciar sesion como `admin@empresa.com`.
2. Entrar a Organizacion y crear un equipo.
3. Crear un usuario con rol y equipo.
4. Ir a Privacidad y conceder/revocar consentimientos.
5. Ir a Senales de texto y guardar un analisis con riesgo.
6. Revisar la alerta creada en Alertas.
7. Cambiar la alerta a `En revision` o `Resuelta`.

## Notas de seguridad

- No guardar `.env` en git.
- No usar claves demo en produccion.
- No tratar los resultados como diagnosticos clinicos.
- Auditar accesos a datos sensibles.
- Separar datos por organizacion.
- Mantener consentimiento explicito por fuente de datos.
