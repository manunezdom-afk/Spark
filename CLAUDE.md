# Spark — Notas para agentes

Spark es la app de aprendizaje activo del ecosistema FOCUS OS. Vive junto a Focus (calendario+IA) y Kairos (notas académicas) en `/Users/martinnunezdominguez/Developer/`. Comparte el proyecto Supabase con los hermanos.

## Reglas no negociables

- **Copy en español neutral con "tú", nunca voseo.** No usar: vos, tenés, sos, querés, podés, hacé, decime, mirá, acá. Sí: tú, tienes, eres, quieres, puedes, haz, dime, mira, aquí. (Misma regla que Kairos — `/Users/martinnunezdominguez/Developer/kairos/CLAUDE.md`).
- **Sin emojis en UI.** El design system del ecosistema lo prohíbe. Usar Lucide icons con `strokeWidth={1.5}`.
- **Sin chat bubbles tradicionales.** El coach habla en `ChallengeCard` (borde izquierdo `#C97B3F`, etiquetado como Nova). El usuario responde en `UserResponseBubble` minimal alineado a la derecha. Nova es la IA del ecosistema y dentro de Spark hace de coach de estudio: contextual, accionable, sin mensajes de chat genéricos.
- **Las claves en `.env.local` nunca se commitean.**

## Boundaries con Focus y Kairos

- Focus dueño del calendario (`focus_calendar_events`). Spark sólo lee `is_critical=true` para `getDaysToNearestDeadline()` (señal de urgencia).
- Kairos dueño de las notas. Spark **no escribe** ahí. Spark lee `kairos_snapshots.data` (pull-only) para inyectar contexto de notas en prompts cuando una topic tiene `source_note_ids`.
- **Contrato del snapshot de Kairos:** Kairos sube el envelope crudo de zustand-persist `{ state: { subjects, sessions, blocks, extractions, ... }, version }`. `getKairosSnapshot()` en `lib/spark/kairos-bridge.ts` desempaca `.state` antes de devolverlo. Si tocas el bridge, respetá ese envelope o todo se rompe sin error visible (la query devuelve null y los prompts pierden el contexto).
- Mismo `auth.users` y `auth.uid()` para los tres. Las RLS policies de Spark filtran por `user_id = auth.uid()`.

## Arquitectura crítica

- **Backend en Route Handlers, no Server Actions** (excepto onboarding form). El streaming SSE para `/api/sessions/[id]/message` necesita Response stream nativo.
- **Modelos:**
  - Sesiones (chat + complete): `claude-sonnet-4-6`
  - Extractor de topics + evaluator: `claude-sonnet-4-6` o `claude-haiku-4-5-20251001` (según costo)
- **JSON payloads:** el modelo emite ` ```json …``` ` al final de cada turn assistant. `extractJsonPayload` (en `lib/streaming/sse.ts`) lo parsea server-side. Si retorna null → emit `event: warning`, persistir turn sin payload, no romper la conversación.
- **Rate limit:** `spark_rate_limits (user_id, day, count)` con upsert+increment. Verificar antes de cada llamada al modelo.
- **SM-2:** el algoritmo está en `modules/spark/scheduler/sm2.ts`. Nunca modificarlo sin tests pasando.

## Flujo de session.complete

1. Cargar todos los turns de la sesión
2. Llamar al modelo con `evaluator.ts` → ScorePayload JSON
3. Para cada `topic_id` en `session.topic_ids`:
   - `quality = scoreToQuality(score)`
   - `sm2(state, quality)` → calcular `ease_factor`, `interval_days`, `next_review_at`
   - Upsert `spark_mastery_states` actualizando `mastery_score` (weighted average), `total_sessions++`
4. Si en algún turn hubo `FlashcardPayload` → insertar cards en `spark_flashcards` con `next_review_at = now`
5. Update session: `status='completed'`, `score`, `feedback`, `ended_at`

## Lo que NO incluye el MVP

- Push real / cron de daily-reviews → reemplazado por banner en `/dashboard`
- Command palette ⌘K
- Push activo Kairos → Spark (hoy es pull-only desde el snapshot; Kairos no notifica cuando hay topics nuevos)
- Force-directed graph para Bridge Builder (lista jerárquica en su lugar)
- Capacitor / iOS nativo

## Convenciones de código

- Prefiero `function` declarations para componentes server, arrow functions para client.
- Nada de `any`. Si necesitas escapar el sistema de tipos, comentar por qué.
- Imports: agrupados (externos → `@/lib` → `@/components` → `@/modules` → relativos), separados por línea en blanco.
- Estados de carga: usar siempre `disabled={busy}` en botones, "Cargando…" / "Guardando…" / "Verificando…" como label.
- Nunca crear archivos `*.md` sin que el usuario lo pida. Excepción: README, CLAUDE.md.

## Comandos

```bash
npm run dev               # dev server (localhost:3000)
npm run build             # producción
npm run lint              # eslint flat config (next/core-web-vitals + typescript)
npm run test              # vitest watch (sm2, engines, sse)
npx tsc --noEmit          # type-check estricto
```
