// Prompts para el simulador de pruebas de Spark.
// Usados por /api/tests/generate y /api/tests/submit.

import type { SparkTopic, TestQuestion, TestAnswer } from '@/modules/spark/types';

function topicsText(topics: SparkTopic[]): string {
  return topics
    .map((t) => `- ${t.title}${t.summary ? ': ' + t.summary : ''}`)
    .join('\n');
}

// ── Generación: alternativas ─────────────────────────────────

export function buildAlternativasGenerationPrompt(
  topics: SparkTopic[],
  count: number
): { system: string; user: string } {
  const system = `Eres un generador de pruebas académicas experto. Tu tarea es crear exactamente ${count} preguntas de alternativas (opción múltiple) de alta calidad.

Responde EXCLUSIVAMENTE con un bloque JSON con esta forma exacta:
\`\`\`json
{
  "questions": [
    {
      "id": 1,
      "text": "pregunta aquí",
      "options": ["A. primera opción", "B. segunda opción", "C. tercera opción", "D. cuarta opción"],
      "correct_index": 2,
      "explanation": "breve explicación de por qué la opción C es la correcta"
    }
  ]
}
\`\`\`

Reglas:
- Genera exactamente ${count} preguntas numeradas del 1 al ${count}
- Cada pregunta tiene exactamente 4 opciones (A, B, C, D)
- correct_index es 0-based (0=A, 1=B, 2=C, 3=D)
- Las opciones incorrectas deben ser plausibles pero claramente erróneas al estudiar bien el tema
- Varía la dificultad: mezcla preguntas fáciles, medias y difíciles
- Cubre distintos aspectos y conceptos de los temas dados
- Las preguntas deben evaluar comprensión real, no memorización superficial`;

  const user = `Genera ${count} preguntas de alternativas sobre los siguientes temas:\n\n${topicsText(topics)}`;

  return { system, user };
}

// ── Generación: desarrollo ───────────────────────────────────

export function buildDesarrolloGenerationPrompt(
  topics: SparkTopic[],
  count: number
): { system: string; user: string } {
  const system = `Eres un generador de pruebas académicas experto. Tu tarea es crear exactamente ${count} preguntas de desarrollo (respuesta abierta).

Responde EXCLUSIVAMENTE con un bloque JSON con esta forma exacta:
\`\`\`json
{
  "questions": [
    {
      "id": 1,
      "text": "pregunta aquí",
      "expected_concepts": ["concepto clave 1", "concepto clave 2", "concepto clave 3"]
    }
  ]
}
\`\`\`

Reglas:
- Genera exactamente ${count} preguntas numeradas del 1 al ${count}
- Cada pregunta incluye 2 a 5 conceptos clave que se esperan en una respuesta completa
- Las preguntas requieren análisis, síntesis o aplicación (no solo definición literal)
- Mezcla preguntas cortas (1-2 párrafos) y más elaboradas (análisis profundo)
- Los conceptos esperados son guías de evaluación, no tienen que aparecer textualmente`;

  const user = `Genera ${count} preguntas de desarrollo sobre los siguientes temas:\n\n${topicsText(topics)}`;

  return { system, user };
}

// ── Evaluación: desarrollo ───────────────────────────────────

export function buildDesarrolloEvaluationPrompt(
  questions: TestQuestion[],
  answers: TestAnswer[]
): { system: string; user: string } {
  const system = `Eres un profesor universitario evaluando respuestas de desarrollo de un examen. Evalúa con rigor académico pero de forma justa y constructiva.

Para cada pregunta asigna:
- score: 0 a 100 (basado en cobertura de conceptos clave y calidad de explicación)
- correct: true si score >= 60
- feedback: retroalimentación constructiva en 1 a 2 oraciones en español

Al final incluye overall_score (promedio redondeado) y overall_feedback (1 a 2 oraciones de resumen).

Si el estudiante no respondió algo, el score es 0 y el feedback indica que no hubo respuesta.

Responde EXCLUSIVAMENTE con este JSON:
\`\`\`json
{
  "results": [
    {
      "question_id": 1,
      "score": 85,
      "correct": true,
      "feedback": "Buena explicación. Podrías haber profundizado también en el concepto X."
    }
  ],
  "overall_score": 85,
  "overall_feedback": "Demuestras comprensión sólida de los temas principales con algunas áreas a reforzar."
}
\`\`\``;

  const pairs = questions
    .map((q) => {
      const ans = answers.find((a) => a.question_id === q.id);
      const respuesta = ans?.text_answer?.trim() || '[Sin respuesta]';
      return `PREGUNTA ${q.id}: ${q.text}\nConceptos esperados: ${(q.expected_concepts ?? []).join(', ')}\nRESPUESTA DEL ESTUDIANTE:\n${respuesta}`;
    })
    .join('\n\n---\n\n');

  const user = `Evalúa las siguientes respuestas de desarrollo:\n\n${pairs}`;

  return { system, user };
}
