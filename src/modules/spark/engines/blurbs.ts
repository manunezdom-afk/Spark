// ── Method blurbs ────────────────────────────────────────────────────
// Descripciones planas, en lenguaje de alumno, de cada método de
// entrenamiento. Se usan en cards de selección y en cualquier UI de
// nivel "explicar al usuario qué hace este método" — cuando hace falta
// una versión más técnica/coach (post-onboarding) usamos
// `engines/personalities.ts > introHook`.
//
// Reglas de escritura:
//   - Una frase, máximo ~70 caracteres.
//   - Verbo en primera persona "te" / "tú" cuando habla Spark/Nova.
//   - Cero metáforas de combate ni jerga académica.

import type { LearningEngine } from "../types";

export const ENGINE_BLURBS: Record<LearningEngine, string> = {
  socratic: "Te hago preguntas hasta que domines el tema.",
  debugger: "Encuentra fallos en respuestas y aprende corrigiendo.",
  devils_advocate: "Argumenta y resiste contraargumentos de Nova.",
  bridge_builder: "Une conceptos de distintas materias.",
  roleplay: "Aplica lo que sabes a una situación concreta.",
  test_alternativas:
    "Genera una prueba de opción múltiple con corrección automática.",
  test_desarrollo:
    "Preguntas abiertas evaluadas según los conceptos clave del tema.",
};
