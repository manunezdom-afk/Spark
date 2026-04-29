import type { EngineContext, LearningEngine, SparkSessionTurn } from '../types';
import { ENGINE_LABELS } from '../engines';

// ── Session Evaluator Prompt ─────────────────────────────────
// Called after the user finalizes a session. Receives the entire
// conversation and produces a strict ScorePayload JSON used by
// SM-2 to update mastery_states.

export function buildEvaluatorPrompt(
  engine: LearningEngine,
  ctx: EngineContext,
  turns: SparkSessionTurn[]
): { system: string; user: string } {
  const topicTitles = ctx.topics.map((t) => t.title).join(', ');

  const system = `Eres un evaluador objetivo de sesiones de aprendizaje activo.

Acabas de presenciar una sesión del motor "${ENGINE_LABELS[engine]}" sobre el/los tema(s): ${topicTitles}.

Tu única tarea es producir un ScorePayload JSON evaluando el desempeño del estudiante. NO conversas, NO felicitas, NO añades texto fuera del bloque JSON.

Criterios de evaluación específicos para "${engine}":
${EVAL_CRITERIA[engine]}

Reglas:
- score: 0–100. Sé exigente. La media (50–60) representa "comprensión funcional pero superficial". 90+ se reserva a respuestas que demuestran maestría aplicada.
- breakdown: 3 a 5 criterios con valores numéricos 0–100 que justifiquen el score global.
- feedback: 2 a 4 oraciones, en segunda persona ("tú"), directas, sin condescendencia. Señala exactamente qué construyó memoria duradera y qué hueco quedó.

Responde EXCLUSIVAMENTE con este formato:

\`\`\`json
{
  "type": "score",
  "score": 0-100,
  "breakdown": [
    { "criterion": "Nombre del criterio", "value": 0-100 }
  ],
  "feedback": "Texto en 2-4 oraciones."
}
\`\`\``;

  const transcript = turns
    .map((t) => `[${t.role === 'assistant' ? 'Spark' : 'Estudiante'}]\n${t.content}`)
    .join('\n\n---\n\n');

  const user = `Transcripción completa de la sesión:\n\n${transcript}\n\n---\n\nEvalúa.`;

  return { system, user };
}

const EVAL_CRITERIA: Record<LearningEngine, string> = {
  socratic: `1. Profundidad: ¿el estudiante llegó a una explicación que ningún apunte le habría dado tal cual?
2. Resistencia al "no sé": ¿persistió cuando la pregunta era difícil, o se rindió?
3. Construcción propia: ¿elaboró conexiones nuevas o solo recitó definiciones?`,

  debugger: `1. Detección: ¿identificó cuántos errores y cuáles?
2. Diagnóstico: ¿explicó por qué eran errores conceptuales (no solo gramaticales)?
3. Corrección: ¿propuso versiones correctas con razonamiento?`,

  devils_advocate: `1. Solidez del argumento: ¿defendió la postura con razones, no con repeticiones?
2. Manejo del ataque: ¿respondió las objeciones reales del adversario?
3. Honestidad intelectual: ¿reconoció cuando un contraargumento era fuerte?`,

  bridge_builder: `1. Conexiones no obvias: ¿propuso puentes que no estaban en el material original?
2. Justificación: ¿explicó la mecánica de la analogía o se quedó en lo superficial?
3. Bidireccionalidad: ¿la conexión enriquece ambos campos o solo uno?`,

  roleplay: `1. Aplicación bajo presión: ¿usó conceptos en respuestas operativas, no teóricas?
2. Adaptación al personaje: ¿respondió al tono y constraints del escenario?
3. Decisión: ¿tomó posiciones concretas en momentos de tensión?`,
};
