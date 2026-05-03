// Engine orchestrator — routes session creation to the correct
// prompt builder and validates engine-specific requirements.

import type {
  LearningEngine,
  CreateSessionRequest,
  EngineContext,
} from '../types';
import { buildMasterSystemPrompt } from '../prompts/master-system';

export interface EngineConfig {
  systemPrompt: string;
  requiresPersona: boolean;
  supportsMultiTopic: boolean;
  minTopics: number;
  maxTopics: number;
}

export function buildEngineConfig(
  req: CreateSessionRequest,
  ctx: EngineContext
): EngineConfig {
  // Test engines use /api/tests/* flow, not the chat session flow
  if (req.engine === 'test_alternativas' || req.engine === 'test_desarrollo') {
    throw new Error('Las pruebas usan /api/tests/generate, no /api/sessions.');
  }

  validateEngineRequest(req);

  return {
    systemPrompt: buildMasterSystemPrompt(req.engine, ctx),
    requiresPersona: req.engine === 'roleplay',
    supportsMultiTopic: req.engine === 'bridge_builder',
    minTopics: ENGINE_TOPIC_LIMITS[req.engine].min,
    maxTopics: ENGINE_TOPIC_LIMITS[req.engine].max,
  };
}

function validateEngineRequest(req: CreateSessionRequest): void {
  const limits = ENGINE_TOPIC_LIMITS[req.engine];

  if (req.topic_ids.length < limits.min) {
    throw new Error(
      `Engine "${req.engine}" requires at least ${limits.min} topic(s). Got ${req.topic_ids.length}.`
    );
  }

  if (req.topic_ids.length > limits.max) {
    throw new Error(
      `Engine "${req.engine}" accepts at most ${limits.max} topic(s). Got ${req.topic_ids.length}.`
    );
  }

  if (req.engine === 'roleplay' && !req.persona) {
    throw new Error('Roleplay engine requires a "persona" field.');
  }
}

const ENGINE_TOPIC_LIMITS: Record<LearningEngine, { min: number; max: number }> = {
  debugger:           { min: 1, max: 2 },
  devils_advocate:    { min: 1, max: 1 },
  roleplay:           { min: 1, max: 3 },
  bridge_builder:     { min: 2, max: 6 },
  socratic:           { min: 1, max: 2 },
  test_alternativas:  { min: 1, max: 5 },
  test_desarrollo:    { min: 1, max: 5 },
};

export const ENGINE_LABELS: Record<LearningEngine, string> = {
  debugger:           'Cazar errores',
  devils_advocate:    'Defender postura',
  roleplay:           'Caso real',
  bridge_builder:     'Conectar temas',
  socratic:           'Preguntas guiadas',
  test_alternativas:  'Prueba de alternativas',
  test_desarrollo:    'Prueba de desarrollo',
};

export const ENGINE_DESCRIPTIONS: Record<LearningEngine, string> = {
  debugger:           'Encuentra los errores escondidos en un texto generado por Spark.',
  devils_advocate:    'Defiende tu postura ante contraargumentos con tus propias notas.',
  roleplay:           'Aplica lo que sabes en un escenario realista con presión.',
  bridge_builder:     'Descubre conexiones no obvias entre materias que creías separadas.',
  socratic:           'Responde preguntas de por qué hasta que el concepto sea tuyo.',
  test_alternativas:  'Preguntas de opción múltiple generadas por IA. Corrección automática.',
  test_desarrollo:    'Preguntas abiertas evaluadas por IA según los conceptos clave del tema.',
};

/**
 * Tags cortos por método — tres verbos que reflejan la experiencia,
 * no la teoría. Se usan en /sessions/new (cards de selección) y en
 * el landing público de Spark (preview antes del login).
 *
 * Las dos pruebas (alternativas/desarrollo) comparten tags porque
 * en la UI son una sola "card virtual" llamada Generar prueba.
 */
export const ENGINE_TAGS: Record<LearningEngine, string[]> = {
  socratic:           ['guiado', 'progresivo', 'comprensión'],
  debugger:           ['detección', 'precisión', 'reto'],
  devils_advocate:    ['debate', 'objeciones', 'rondas'],
  bridge_builder:     ['relaciones', 'mapa mental', 'síntesis'],
  roleplay:           ['aplicación', 'escenario', 'decisión'],
  test_alternativas:  ['evaluación', 'nota', 'revisión'],
  test_desarrollo:    ['evaluación', 'nota', 'revisión'],
};
