# Spark

> La app de **Focus OS** para estudiar activamente. Convierte apuntes en flashcards, quizzes y simulaciones para preparar pruebas reales con la ayuda de Nova.

Spark forma parte de un ecosistema de tres apps:

| App        | Pregunta que responde                                |
| ---------- | ---------------------------------------------------- |
| **Focus**  | ¿Cuándo y qué tengo que hacer?                       |
| **Kairos** | ¿Qué tengo que estudiar y dónde está mi material?    |
| **Spark**  | ¿Cómo me preparo activamente para rendir bien?       |

## Métodos de práctica (MVP)

| Método              | Para qué                                           | Estado     |
| ------------------- | -------------------------------------------------- | ---------- |
| 🃏 Flashcards       | Memoria duradera con repaso espaciado (SM-2)       | UI / mock  |
| 📝 Quiz             | Alternativas tipo prueba                           | UI / mock  |
| 🎯 Simulación       | Mix cronometrado de preguntas                      | UI / mock  |
| 💭 Método Socrático | Nova pregunta "¿por qué?" hasta dominar            | UI / mock  |

> **Nota**: la generación real con Nova y el guardado en Supabase están en desarrollo. La UI de práctica es funcional y muestra cómo se sentirá la experiencia final.

## Estructura

```
src/
├── app/
│   ├── page.tsx                       # Spark dashboard (home)
│   ├── spark/
│   │   ├── layout.tsx                 # navbar con SparkIcon
│   │   ├── page.tsx                   # redirect → /
│   │   ├── session/new/page.tsx       # crear sesión (3 pasos)
│   │   └── practice/active/page.tsx   # pantalla de práctica (mock)
│   └── api/spark/...                  # backend de sesiones (Supabase)
├── components/SparkIcon.tsx           # SVG oficial
├── lib/spark/
│   ├── methods.ts                     # 4 métodos UI ↔ engines backend
│   └── queries.ts                     # capa de datos (Supabase)
└── modules/spark/                     # backend: engines, prompts, SM-2, types
```

## Roadmap

Ver [ROADMAP.md](./ROADMAP.md) para qué falta y prioridades.
