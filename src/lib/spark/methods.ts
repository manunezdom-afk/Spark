// Study methods exposed to the user. Each method is the user-facing label
// for one or more backend engines. Keeps the UI vocabulary student-first
// while preserving the existing /modules/spark engines.

import type { LearningEngine } from '@/modules/spark/types';

export type StudyMethod = 'flashcards' | 'quiz' | 'simulation' | 'socratic';

export interface MethodMeta {
  id:           StudyMethod;
  emoji:        string;
  label:        string;
  short:        string;        // ≤ 6 words, used in cards
  description:  string;        // 1 line
  /** Whether the backend can actually run this method today (vs mock). */
  ready:        boolean;
  /** Engine in /modules/spark/engines that powers this method. */
  engine:       LearningEngine | null;
}

export const METHODS: Record<StudyMethod, MethodMeta> = {
  flashcards: {
    id:          'flashcards',
    emoji:       '🃏',
    label:       'Flashcards',
    short:       'Repaso con tarjetas',
    description: 'Convierte conceptos en pares pregunta-respuesta para memoria duradera.',
    ready:       false,           // mock until Nova generation is wired
    engine:      null,
  },
  quiz: {
    id:          'quiz',
    emoji:       '📝',
    label:       'Quiz',
    short:       'Alternativas tipo prueba',
    description: 'Preguntas con alternativas para medir qué tan preparado estás.',
    ready:       false,
    engine:      null,
  },
  simulation: {
    id:          'simulation',
    emoji:       '🎯',
    label:       'Simulación de prueba',
    short:       'Mix cronometrado',
    description: 'Mezcla de preguntas con tiempo, como una prueba real.',
    ready:       false,
    engine:      null,
  },
  socratic: {
    id:          'socratic',
    emoji:       '💭',
    label:       'Método Socrático',
    short:       'Solo "¿por qué?"',
    description: 'Nova pregunta "¿por qué?" hasta que el concepto sea tuyo de verdad.',
    ready:       true,
    engine:      'socratic',
  },
};

export const METHOD_ORDER: StudyMethod[] = ['flashcards', 'quiz', 'simulation', 'socratic'];

/** Legacy: map old `?engine=` query param to a method id, for compat. */
export function methodFromEngineParam(engine: string | null | undefined): StudyMethod | null {
  if (!engine) return null;
  if (engine === 'socratic')      return 'socratic';
  return null; // debugger/devils_advocate/roleplay/bridge_builder → not exposed in MVP
}
