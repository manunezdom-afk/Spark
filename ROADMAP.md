# Spark — Roadmap

## ✅ Listo (MVP UI)

- Dashboard con CTA principal, 4 métodos, sesiones recientes (empty state) y debilidades (empty state).
- Creación de sesión en 3 pasos (nombre + método + contenido).
- Pantalla de práctica activa (mock estático) con flashcard reveal y feedback de dominio.
- Backend de sesiones (`/api/spark/session`) y validación por engine.
- Schema completo en Supabase (`supabase/`).
- Lógica SM-2 (`modules/spark/scheduler/sm2.ts`).
- Builder de system prompt (`modules/spark/prompts/master-system.ts`).

## 🚧 En desarrollo (próxima iteración)

| # | Tarea                                                                         | Bloquea                  |
| - | ----------------------------------------------------------------------------- | ------------------------ |
| 1 | Conectar Nova: `POST /api/spark/generate` que reciba contenido + método       | Práctica real            |
| 2 | Persistir sesión real al submit (hoy es mock con `setTimeout`)                | Sesiones recientes reales|
| 3 | Render de payloads tipados (FlashcardPayload, QuizPayload, etc.)              | Pantalla de práctica     |
| 4 | Auto-grading de respuestas abiertas con `expected_concepts`                   | Quiz / Socrático         |
| 5 | Cálculo de dominio post-sesión + actualización SM-2                           | Debilidades detectadas   |
| 6 | Login real con Supabase + middleware de auth en `/spark/*`                    | Todo lo anterior         |

## 🔮 Próximamente (integración con ecosistema)

- **← Kairos**: importar apuntes/temas como contenido de sesión.
- **→ Focus**: agendar repasos automáticamente según `next_review_at` de SM-2.
- **Modo debilidades**: armar sesión específica con los temas de menor dominio.
- **Histórico**: timeline de sesiones por prueba/control.
- **Engines avanzados**: re-exponer Debugger, Devil's Advocate, Roleplay y Bridge Builder como modos avanzados (hoy quedan vivos en backend pero no en UI).

## ⚠️ Decisiones tomadas

- **Vocabulario estudiantil**: solemne, control, certamen, apuntes, prueba — no "engines abstractos".
- **4 métodos universales**: flashcards, quiz, simulación, socrático. Los 4 modos avanzados existen en el backend pero no se exponen en MVP.
- **Sin promesas falsas**: integraciones con Kairos/Focus aparecen solo como "próximamente".
- **`/spark` redirige a `/`**: Spark IS la app (no un módulo dentro de algo más grande), por eso la home raíz es Spark.
