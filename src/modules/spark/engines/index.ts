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
  debugger:           'The Debugger',
  devils_advocate:    'Abogado del Diablo',
  roleplay:           'Roleplay de Alta Presión',
  bridge_builder:     'Bridge Builder',
  socratic:           'Método Socrático',
  test_alternativas:  'Prueba de Alternativas',
  test_desarrollo:    'Prueba de Desarrollo',
};

export const ENGINE_DESCRIPTIONS: Record<LearningEngine, string> = {
  debugger:           'Encuentra los 3 errores ocultos en el texto generado por Spark.',
  devils_advocate:    'Defiende tu postura ante argumentos adversariales con tus propias notas.',
  roleplay:           'Aplica tus conocimientos en un escenario de alta presión con consecuencias reales.',
  bridge_builder:     'Descubre conexiones no obvias entre materias que creías separadas.',
  socratic:           'Responde preguntas de por qué hasta que el conocimiento sea tuyo de verdad.',
  test_alternativas:  'Preguntas de opción múltiple generadas por IA. Corrección automática.',
  test_desarrollo:    'Preguntas abiertas evaluadas por IA según los conceptos clave del tema.',
};
