# Spark — Entrenador cognitivo

Spark es el motor de aprendizaje activo de FOCUS OS. No memorizas: entrenas. Cinco engines (Socrático, Debugger, Abogado del Diablo, Bridge Builder, Roleplay) te obligan a pensar y construir memoria duradera, con repetición espaciada (SM-2) y mastery tracking.

> Es una de las tres apps del ecosistema. Vive junto a Focus (calendario+IA) y Kairos (notas académicas).

## Stack

- **Next.js 15** App Router + **React 18** + **TypeScript** strict
- **Tailwind 3** + **shadcn/ui** (Radix primitives) + **Lucide icons**
- **Zustand** (estado de sesión activa)
- **Supabase** (Auth + Postgres + RLS, mismo proyecto que Focus/Kairos)
- **Anthropic SDK** — Claude Sonnet 4.6 (sesiones) + Claude Haiku 4.5 (extracción de topics)
- **next-pwa** + Web Push (post-MVP) + Vitest

## Setup

```bash
cp .env.local.example .env.local       # llenar SUPABASE + ANTHROPIC keys
npm install
npm run dev                              # http://localhost:3000
```

Migrar el schema (en Supabase SQL Editor o vía CLI):

```sql
-- 1. supabase/migrations/20260428000001_spark_schema.sql
-- 2. supabase/migrations/20260429000001_spark_rate_limits.sql
```

## Estructura

```
src/
  app/
    (app)/             # rutas autenticadas (Sidebar + MobileNav)
      dashboard/       # Hoy: due reviews, sesiones abiertas, recomendados
      topics/          # CRUD + detail con mastery + iniciar sesión
      sessions/        # new (form) + [id] (chat con Spark)
      flashcards/      # review queue SM-2
      mastery/         # progreso por tema
      errors/          # patrones recurrentes
      cuenta/          # perfil + instalación PWA
    api/
      sessions/        # crear, listar, /:id/message (SSE), /:id/complete
      topics/          # CRUD + extract (Claude Haiku)
      flashcards/      # listar due, /:id/review (SM-2 update)
      user-context/    # GET/PUT contexto persistente del usuario
    login/             # OTP de 6 dígitos
    onboarding/        # captura career, projects, goals
    auth/callback/     # exchange OAuth code

  components/
    payloads/          # 5 renderers tipados (Flashcard, Quiz, Debugger, Graph, Score)
    session/           # Shell, Timeline, ChallengeCard, UserResponseInput
    topics/            # TopicCard, NewTopicDialog (manual + extraer)
    mastery/           # MasteryBar, FlashcardReview
    layout/            # Sidebar (desktop) + MobileNav (móvil)
    ui/                # Button, Card, Input, Dialog, Badge…

  modules/spark/        # IP del proyecto (no tocar a la ligera)
    types/              # discriminated unions de payloads + dominio
    prompts/            # master-system + evaluator
    scheduler/sm2.ts    # SuperMemo 2 + scoreToQuality + recommendEngines
    engines/            # validador + labels + descriptions

  lib/
    spark/queries.ts    # todas las queries Supabase
    streaming/sse.ts    # helpers SSE + extractJsonPayload
    streaming/client.ts # consumer de SSE en el browser
    auth/session.tsx    # AuthProvider + useSparkAuth + sendOtp/verifyOtp
    supabase/           # server (SSR) + client (browser)
    stores/session.ts   # Zustand para sesión activa
```

## Flujo principal

1. `/login` → email → OTP de 6 dígitos → middleware redirige a `/onboarding` (primera vez) o `/dashboard`
2. `/topics` → "Nuevo tema" → pegar texto → Claude Haiku extrae conceptos → seleccionar → guardar
3. `/topics/[id]` → click un engine → `/sessions/new?engine=X&topic=Y` → "Comenzar" → `/sessions/[id]`
4. La sesión se abre con el primer "challenge" del coach (streaming SSE token a token). Respondes, Spark contesta, alterna texto + payloads tipados (flashcards, quiz, debugger interactivo…)
5. "Finalizar" → evaluator de Claude produce `ScorePayload` JSON → SM-2 actualiza `mastery_states` → flashcards generadas se persisten
6. `/flashcards/review` → queue diaria con quality 0–5 → SM-2 reprograma `next_review_at`

## Tests

```bash
npm run test       # Vitest: SM-2, engines validator, SSE/JSON extractor
npm run lint       # ESLint flat config
npx tsc --noEmit   # type-check
npm run build      # build de producción
```

## Decisiones de diseño

- **No es chatbot.** Spark coachea: turns assistant son `ChallengeCard` con borde naranja (`#C97B3F`), turns user son bubbles minimal alineadas a la derecha.
- **Streaming SSE** con dos tipos de eventos (`text-delta`, `payload`, `warning`, `done`). El payload se parsea server-side al final del stream y se manda como evento separado, así el cliente no parsea JSON parcial.
- **Rate limit:** tabla `spark_rate_limits` (user_id, day, count) con upsert+increment. 100 messages/día/user por defecto.
- **No push real en MVP.** En lugar de notificaciones, banner "Tienes X reviews pendientes" en `/dashboard`.
- **Topics ingestion:** manual + "extraer de texto pegado" con Claude Haiku. El bridge real con Kairos llegará cuando Kairos exponga blocks tipados.

## Roadmap post-MVP

- Bridge Kairos: importar topics desde notas académicas
- Web Push real + cron diario para SM-2 due
- Command palette ⌘K
- Knowledge graph force-directed (Bridge Builder)
- Mobile app (Capacitor) si gana tracción
