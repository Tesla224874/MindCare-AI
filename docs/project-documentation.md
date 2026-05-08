# MindCare.AI - Documentacion integral del proyecto

## 1. Resumen

MindCare.AI es una aplicacion full-stack orientada a bienestar organizacional, prevencion temprana y seguimiento humano. El producto combina:

- Dashboard organizacional con metricas preventivas.
- Analisis de mensajes con motor de reglas y adaptador IA.
- Alertas preventivas.
- Casos preventivos con notas, acciones y trazabilidad.
- Chat preventivo de bienestar limitado a salud mental, autocuidado, estres, sueno, habitos y crisis.
- Gestion de organizacion, equipos, usuarios, consentimientos y auditoria.

El sistema no busca diagnosticar condiciones clinicas ni automatizar decisiones laborales. Su objetivo es detectar senales preventivas, orientar apoyo humano y mantener trazabilidad.

## 2. Stack tecnologico

### Frontend y full-stack

- Next.js 16.2.4 con App Router.
- React 19.2.4.
- Server Components y Server Actions.
- TypeScript.
- Tailwind CSS 4.
- Lucide React para iconos.
- Recharts para visualizacion.
- Radix UI para componentes base.

### Backend y datos

- Prisma 7.8.
- PostgreSQL.
- `@prisma/adapter-pg` y `pg`.
- Server Actions para mutaciones.
- Cookies HTTP-only firmadas con HMAC para sesiones.

### Monorepo y paquetes

- npm workspaces.
- `apps/web`: aplicacion Next.js.
- `packages/database`: Prisma schema, migraciones y SQL inicial.
- `packages/analysis`: motor de analisis preventivo y adaptador IA.
- `packages/shared`: tipos, constantes y utilidades compartidas.

### IA y chatbot

- Motor local de reglas: `rules-mvp`.
- Adaptador IA de analisis: `ANALYSIS_ENGINE`.
- Chat IA generativo configurable: `CHAT_ENGINE`, `CHAT_AI_ENDPOINT`, `CHAT_AI_API_KEY`, `CHAT_AI_MODEL`.
- Compatible con endpoints estilo OpenAI Chat Completions y Responses.
- OpenRouter puede usarse con endpoint compatible.

## 3. Estructura del repositorio

```text
MindCare-AI/
  .github/workflows/
    deploy.yml
  apps/
    web/
      app/
      components/
      lib/
      prisma/
      scripts/
      tests/
      package.json
      next.config.ts
      prisma.config.ts
  packages/
    analysis/
      src/
    database/
      prisma/
        schema.prisma
        migrations/
        init-db.sql
    shared/
      src/
  docs/
  package.json
  README.md
```

## 4. Arquitectura general

La arquitectura separa responsabilidades por capas:

- `apps/web/app`: rutas, layouts, paginas, Server Actions y route handlers.
- `apps/web/components`: componentes cliente y componentes de UI.
- `apps/web/lib`: autenticacion, sesion, permisos, Prisma client, acceso a datos y logica especifica de la app.
- `packages/database/prisma`: contrato de datos y migraciones.
- `packages/analysis/src`: contrato de analisis preventivo, reglas y adaptador IA.
- `packages/shared/src`: tipos compartidos de auth, roles y analisis.

Flujo tipico:

```text
Usuario -> Next.js Page/Component -> Server Action -> lib/data -> Prisma -> PostgreSQL
                                            |
                                            -> packages/analysis
                                            -> Chat AI provider, si aplica
```

## 5. Modelo de dominio

### Organizacion y usuarios

- `Organization`: tenant principal.
- `Team`: equipos dentro de la organizacion.
- `User`: usuarios con rol, equipo, estado activo y credenciales.
- `Consent`: consentimientos por fuente de senal.

Roles disponibles:

- `ADMIN`: acceso administrativo.
- `WELLBEING`: bienestar/RR.HH. operativo.
- `TEAM_LEAD`: lider de equipo.
- `AUDITOR`: lectura y auditoria.
- `EMPLOYEE`: colaborador.

### Analisis y mensajes

- `Message`: mensaje minimizado. Guarda hash, preview redactada, autor, equipo y fecha.
- `MessageAnalysis`: resultado de analisis preventivo con score, nivel, confianza y senales.

Niveles de riesgo:

- `LOW`
- `OBSERVATION`
- `PREVENTIVE_ATTENTION`
- `HIGH`

### Alertas y casos

- `PreventiveAlert`: alerta preventiva creada por analisis o chat.
- `InterventionCase`: caso humano derivado de una alerta.
- `CaseNote`: notas internas/auditoria.
- `CaseAction`: acciones registradas sobre el caso.

Los casos tienen estado:

- `TRIAGE`
- `ACTIVE`
- `MONITORING`
- `ESCALATED`
- `CLOSED`

Y prioridad:

- `LOW`
- `STANDARD`
- `HIGH`
- `URGENT`

### Chat preventivo

- `ChatSession`: sesion de chat por usuario. Puede estar `ACTIVE` o `ARCHIVED`.
- `ChatMessage`: mensaje de usuario o asistente. Guarda hash y preview.
- `ChatAnalysis`: lectura preventiva asociada al mensaje del usuario.

El boton "Comenzar nuevo chat" archiva la sesion activa y permite iniciar una nueva conversacion sin borrar historial.

## 6. Funcionamiento de autenticacion

El login usa email y password hash.

Flujo:

1. Usuario envia credenciales en `/login`.
2. `loginAction` valida usuario activo y password.
3. Se crea un payload de sesion con `userId`, `organizationId`, `role` y expiracion.
4. El payload se firma con HMAC SHA-256 usando `AUTH_SECRET`.
5. Se guarda en cookie HTTP-only.
6. `proxy.ts` protege rutas `/dashboard`.
7. `getCurrentUser` carga el usuario desde DB y valida que siga activo.

La sesion no usa JWT externo; usa token firmado localmente.

## 7. Autorizacion y permisos

Los permisos se definen en `apps/web/lib/permissions.ts`.

Rutas principales:

- `/dashboard`: todos los roles.
- `/dashboard/alerts`: `ADMIN`, `WELLBEING`, `AUDITOR`.
- `/dashboard/cases`: `ADMIN`, `WELLBEING`, `AUDITOR`.
- `/dashboard/chat`: `ADMIN`, `WELLBEING`, `TEAM_LEAD`, `EMPLOYEE`.
- `/dashboard/messages`: `ADMIN`, `WELLBEING`.
- `/dashboard/organization`: `ADMIN`, `WELLBEING`.
- `/dashboard/privacy`: `ADMIN`, `WELLBEING`, `AUDITOR`.

Las paginas sensibles usan `requireRoles`.

## 8. Motor de analisis preventivo

El motor principal esta en `packages/analysis/src/rules-engine.ts`.

Detecta senales como:

- Ideacion suicida o autolesion.
- Sobrecarga y estres.
- Aislamiento comunicacional.
- Desesperanza o abandono.
- Conflicto o frustracion.
- Factores protectores.

La regla `self_harm_crisis` fuerza puntuacion alta cuando detecta lenguaje de suicidio o autolesion. Esto evita que textos criticos queden como bajo riesgo.

Ejemplos criticos cubiertos:

- "quiero suicidarme"
- "tengo tendencias para autolesionarme"
- "no quiero vivir"
- "hacerme dano"
- "matarme"

El resultado incluye:

- `score`: 0 a 100.
- `level`: Bajo, Observacion, Atencion preventiva o Riesgo alto.
- `confidence`.
- `signals`.
- `modelName`.
- `disclaimer`.

## 9. Chatbot de bienestar

El chat esta en:

- UI: `apps/web/components/ui/preventive-chat.tsx`
- Server Actions: `apps/web/app/(dashboard)/dashboard/chat/actions.ts`
- Datos: `apps/web/lib/data/chat.ts`
- Adaptador IA: `apps/web/lib/chat/assistant.ts`

### Objetivo

El chatbot funciona como asistente de bienestar, no como terapeuta clinico.

Alcance permitido:

- Salud general.
- Bienestar emocional.
- Estres.
- Sueno.
- Habitos saludables.
- Autocuidado.
- Crisis y derivacion humana.
- Orientacion para buscar ayuda profesional.

Fuera de alcance:

- Diagnosticos clinicos.
- Tratamientos personalizados.
- Decisiones laborales.
- Temas no relacionados con salud/bienestar.

### Flujo de chat

1. Usuario envia un mensaje.
2. Se analiza el texto con `analyzeMessageForStorage`.
3. Se calcula nivel de riesgo.
4. Se llama al proveedor IA si `CHAT_ENGINE="ai"`.
5. Si el riesgo es elevado, se crea `PreventiveAlert`.
6. Se guarda mensaje de usuario minimizado.
7. Se guarda respuesta del asistente.
8. Se guarda `ChatAnalysis`.
9. Se registra auditoria.

### Seguridad de crisis

Si hay autolesion, suicidio o riesgo inmediato:

- La lectura escala a `HIGH`.
- Puede crearse alerta preventiva.
- Si el proveedor IA falla, se usa fallback local de seguridad.
- La respuesta debe priorizar contacto humano y ayuda de emergencia local.

### Calidad de respuesta

El prompt interno exige:

- Espanol natural.
- Tono humano.
- Escucha activa.
- Validacion emocional.
- Una sola pregunta util cuando corresponda.
- Sin palabras inventadas, traducciones raras o mezcla innecesaria de idiomas.

Ademas hay una validacion basica para bloquear respuestas de baja calidad del proveedor IA.

## 10. Dashboard y modulos funcionales

### Dashboard principal

Ruta: `/dashboard`

Muestra:

- Indice de bienestar.
- Alertas preventivas abiertas/en revision.
- Riesgo agregado.
- Usuarios activos.
- Senales principales.
- Alertas recientes.
- Recomendaciones para colaborador.

### Mensajes y analisis

Ruta: `/dashboard/messages`

Permite:

- Probar analisis de texto.
- Guardar analisis en PostgreSQL.
- Crear alertas automaticamente si el riesgo es preventivo o alto.

### Alertas

Ruta: `/dashboard/alerts`

Permite:

- Ver alertas.
- Filtrar por estado/nivel.
- Cambiar estado.
- Abrir caso preventivo desde una alerta.

### Casos

Ruta: `/dashboard/cases`

Permite:

- Ver casos activos, escalados, vencidos y cerrados.
- Cambiar estado.
- Registrar notas.
- Registrar acciones.
- Ver historial reciente.

### Organizacion

Ruta: `/dashboard/organization`

Permite ver equipos, usuarios y estadisticas organizacionales.

### Privacidad

Ruta: `/dashboard/privacy`

Permite revisar consentimientos, fuentes de senal y auditoria.

## 11. Privacidad y minimizacion de datos

El sistema intenta reducir exposicion de informacion sensible:

- Los mensajes se guardan con `contentHash`.
- Se almacena una `redactedPreview`, no un campo de contenido completo.
- El chat tambien usa hash y preview.
- Las alertas contienen resumen y accion recomendada.
- La auditoria registra acciones del sistema.
- Consentimientos controlan fuentes de senal.

Nota: `redactedPreview` sigue siendo texto visible y debe tratarse como dato sensible. En produccion podria reemplazarse por resumen seguro o eliminarse para mayor privacidad.

## 12. Variables de entorno

Variables principales:

```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="secret-fuerte"
```

Analisis:

```env
ANALYSIS_ENGINE="rules"
ANALYSIS_AI_ENDPOINT=""
ANALYSIS_AI_API_KEY=""
```

Chat IA:

```env
CHAT_ENGINE="ai"
CHAT_AI_ENDPOINT="https://openrouter.ai/api/v1/chat/completions"
CHAT_AI_API_KEY="..."
CHAT_AI_MODEL="openrouter/free"
```

Tambien puede usarse endpoint tipo OpenAI Responses:

```env
CHAT_AI_ENDPOINT="https://api.openai.com/v1/responses"
CHAT_AI_MODEL="gpt-5"
```

Para modo local:

```env
CHAT_ENGINE="local"
```

## 13. Comandos principales

Instalar dependencias:

```powershell
npm.cmd install
```

Desarrollo:

```powershell
npm.cmd run web:dev
```

Tests:

```powershell
npm.cmd run test
```

Lint:

```powershell
npm.cmd run lint
```

Typecheck:

```powershell
npm.cmd run typecheck
```

Build:

```powershell
npm.cmd run web:build
```

Validacion de produccion:

```powershell
npm.cmd run prod:check
```

Migraciones:

```powershell
npm.cmd run db:status
npm.cmd run db:deploy
npm.cmd run db:generate
```

Seed:

```powershell
npm.cmd run db:seed
```

## 14. Base de datos y migraciones

El schema esta en:

```text
packages/database/prisma/schema.prisma
```

Las migraciones estan en:

```text
packages/database/prisma/migrations/
```

Migraciones relevantes:

- `20260506190000_init`: schema inicial.
- `20260507013000_intervention_cases`: casos preventivos.
- `20260507023000_chat_bot`: chatbot preventivo.
- `20260507024500_chat_session_status`: estado activo/archivado de sesiones de chat.

En produccion se usa:

```powershell
npm.cmd run db:deploy
```

## 15. CI/CD y despliegue

El workflow esta en:

```text
.github/workflows/deploy.yml
```

Valida en PR y push a `main`:

- Instalacion.
- Build de paquetes.
- Tests.
- Lint.
- Typecheck.
- `prod:check`.
- Build web.

El despliegue a Vercel es manual via `workflow_dispatch` con `deploy_production=true`.

Secrets requeridos:

```text
DATABASE_URL
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

Variables de Vercel recomendadas:

```text
DATABASE_URL
AUTH_SECRET
ANALYSIS_ENGINE
ANALYSIS_AI_ENDPOINT
ANALYSIS_AI_API_KEY
CHAT_ENGINE
CHAT_AI_ENDPOINT
CHAT_AI_API_KEY
CHAT_AI_MODEL
```

## 16. Testing

Los tests viven en:

```text
apps/web/tests/
```

Cobertura actual:

- Motor de analisis.
- Escalada de ideacion suicida/autolesion.
- Auth y token de sesion.
- Password hashing.
- Permisos por rol.
- Adaptador de analisis IA con fallback.

Comando:

```powershell
npm.cmd run test
```

## 17. Consideraciones de seguridad

Implementado:

- Cookies HTTP-only.
- Firma HMAC para sesiones.
- Rechazo de secretos debiles en produccion.
- Password hashing con `scrypt`.
- Rate limit de login en memoria.
- RBAC por ruta.
- Auditoria de acciones relevantes.
- Minimizacion de mensajes con hash.
- Deteccion fuerte de autolesion/suicidio.

Riesgos o mejoras pendientes:

- El rate limit en memoria no escala en serverless/multiples instancias.
- `redactedPreview` conserva texto sensible.
- El chatbot requiere evaluaciones de seguridad adicionales antes de uso real.
- Se recomienda monitoreo de errores de proveedor IA.
- Se recomienda separar auditoria de seguridad en una vista dedicada.

## 18. Roadmap sugerido

Prioridad alta:

- Panel dedicado de auditoria.
- Mejorar gestion de casos: responsable, prioridad editable, SLA y filtros avanzados.
- Mejorar privacidad: eliminar o resumir `redactedPreview`.
- Evaluaciones del chatbot con casos de crisis.
- Rate limiting persistente con DB o Redis.

Prioridad media:

- Historial de conversaciones archivadas.
- Exportacion CSV de auditoria.
- Notificaciones internas.
- Reportes ejecutivos agregados.
- Portal de colaborador mas completo.

Prioridad futura:

- Integracion con proveedor IA gestionado para produccion.
- Modelo local privado para clientes enterprise.
- Observabilidad y trazas de IA.
- Politicas de retencion de datos.

## 19. Principios del producto

- No diagnosticar.
- No automatizar decisiones laborales.
- Escalar a apoyo humano cuando corresponda.
- Minimizar datos sensibles.
- Mantener auditoria.
- Priorizar seguridad en crisis.
- Presentar informacion agregada cuando sea posible.

