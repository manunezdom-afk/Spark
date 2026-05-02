// ── Engine themes ───────────────────────────────────────────────────
// Visual identity per learning engine. Each theme drives the session
// shell, challenge card, intro stage and input. Keep these stable —
// changing a key here will affect every session view and route that
// references them via `getEngineTheme()`.

import {
  Bug,
  Drama,
  HelpCircle,
  Spline,
  Swords,
  type LucideIcon,
} from 'lucide-react';

import type { LearningEngine } from '../types';

export interface EngineTheme {
  /** Lucide icon used in the shell + intro stage */
  Icon: LucideIcon;
  /** Single accent color used for borders, badges, progress fills */
  accent: string;
  /** Soft tint applied to the conversation surface */
  tint: string;
  /** Background gradient for the engine header strip */
  headerGradient: string;
  /** Background gradient for the intro / stage card */
  stageGradient: string;
  /** Glow / radial used behind the stage icon */
  stageGlow: string;
  /** Gradient used for the "Nova" coach label inside ChallengeCard */
  coachGradient: string;
  /** One-word vibe — used as a tagline above the engine name */
  vibe: string;
  /** Short description of the act inside the session (≤ ~70 chars) */
  pitch: string;
  /** Engine-specific verb for what Nova is doing during streaming */
  streamingLabel: string;
  /** Border color used by ChallengeCard left rail */
  borderColor: string;
  /** Decoration motif rendered inside the intro stage */
  motif: 'rings' | 'scan' | 'crossed' | 'network' | 'spotlight';
}

const THEMES: Record<Exclude<LearningEngine, 'test_alternativas' | 'test_desarrollo'>, EngineTheme> = {
  socratic: {
    Icon: HelpCircle,
    accent: '#8B5CF6',
    tint: 'rgba(139, 92, 246, 0.05)',
    headerGradient:
      'linear-gradient(120deg, rgba(139,92,246,0.18) 0%, rgba(217,70,239,0.10) 55%, rgba(255,255,255,0) 100%)',
    stageGradient:
      'linear-gradient(135deg, rgba(139,92,246,0.10) 0%, rgba(217,70,239,0.06) 45%, rgba(255,255,255,0.02) 100%)',
    stageGlow:
      'radial-gradient(circle at 50% 50%, rgba(139,92,246,0.32) 0%, rgba(217,70,239,0.16) 45%, transparent 70%)',
    coachGradient: 'linear-gradient(90deg, #8B5CF6, #D946EF)',
    vibe: 'Diálogo socrático',
    pitch: 'Solo preguntas. Tú llegas a la respuesta.',
    streamingLabel: 'formulando pregunta',
    borderColor: 'rgba(139, 92, 246, 0.55)',
    motif: 'rings',
  },
  debugger: {
    Icon: Bug,
    accent: '#EA580C',
    tint: 'rgba(234, 88, 12, 0.05)',
    headerGradient:
      'linear-gradient(120deg, rgba(234,88,12,0.20) 0%, rgba(220,38,38,0.10) 55%, rgba(255,255,255,0) 100%)',
    stageGradient:
      'linear-gradient(135deg, rgba(234,88,12,0.12) 0%, rgba(220,38,38,0.06) 45%, rgba(255,255,255,0.02) 100%)',
    stageGlow:
      'radial-gradient(circle at 50% 50%, rgba(234,88,12,0.34) 0%, rgba(220,38,38,0.16) 45%, transparent 70%)',
    coachGradient: 'linear-gradient(90deg, #EA580C, #DC2626)',
    vibe: 'Modo detective',
    pitch: 'Encuentra los errores ocultos en el texto.',
    streamingLabel: 'preparando trampas',
    borderColor: 'rgba(234, 88, 12, 0.55)',
    motif: 'scan',
  },
  devils_advocate: {
    Icon: Swords,
    accent: '#BE123C',
    tint: 'rgba(190, 18, 60, 0.05)',
    headerGradient:
      'linear-gradient(120deg, rgba(190,18,60,0.20) 0%, rgba(225,29,72,0.10) 55%, rgba(255,255,255,0) 100%)',
    stageGradient:
      'linear-gradient(135deg, rgba(190,18,60,0.12) 0%, rgba(225,29,72,0.06) 45%, rgba(255,255,255,0.02) 100%)',
    stageGlow:
      'radial-gradient(circle at 50% 50%, rgba(190,18,60,0.34) 0%, rgba(225,29,72,0.16) 45%, transparent 70%)',
    coachGradient: 'linear-gradient(90deg, #BE123C, #E11D48)',
    vibe: 'Debate adversarial',
    pitch: 'Defiende tu postura ante ataques sistemáticos.',
    streamingLabel: 'cargando contrargumento',
    borderColor: 'rgba(190, 18, 60, 0.55)',
    motif: 'crossed',
  },
  bridge_builder: {
    Icon: Spline,
    accent: '#0891B2',
    tint: 'rgba(8, 145, 178, 0.05)',
    headerGradient:
      'linear-gradient(120deg, rgba(8,145,178,0.20) 0%, rgba(14,165,233,0.10) 55%, rgba(255,255,255,0) 100%)',
    stageGradient:
      'linear-gradient(135deg, rgba(8,145,178,0.12) 0%, rgba(14,165,233,0.06) 45%, rgba(255,255,255,0.02) 100%)',
    stageGlow:
      'radial-gradient(circle at 50% 50%, rgba(8,145,178,0.30) 0%, rgba(14,165,233,0.14) 45%, transparent 70%)',
    coachGradient: 'linear-gradient(90deg, #0891B2, #0EA5E9)',
    vibe: 'Síntesis interdisciplinaria',
    pitch: 'Conecta ideas de temas distintos.',
    streamingLabel: 'tendiendo el puente',
    borderColor: 'rgba(8, 145, 178, 0.55)',
    motif: 'network',
  },
  roleplay: {
    Icon: Drama,
    accent: '#D97706',
    tint: 'rgba(217, 119, 6, 0.05)',
    headerGradient:
      'linear-gradient(120deg, rgba(217,119,6,0.20) 0%, rgba(245,158,11,0.10) 55%, rgba(255,255,255,0) 100%)',
    stageGradient:
      'linear-gradient(135deg, rgba(217,119,6,0.12) 0%, rgba(245,158,11,0.06) 45%, rgba(255,255,255,0.02) 100%)',
    stageGlow:
      'radial-gradient(circle at 50% 50%, rgba(217,119,6,0.34) 0%, rgba(245,158,11,0.16) 45%, transparent 70%)',
    coachGradient: 'linear-gradient(90deg, #D97706, #F59E0B)',
    vibe: 'Escenario en vivo',
    pitch: 'Aplica lo que sabes con un personaje real.',
    streamingLabel: 'entrando en personaje',
    borderColor: 'rgba(217, 119, 6, 0.55)',
    motif: 'spotlight',
  },
};

const FALLBACK: EngineTheme = THEMES.socratic;

export function getEngineTheme(engine: LearningEngine): EngineTheme {
  if (engine === 'test_alternativas' || engine === 'test_desarrollo') return FALLBACK;
  return THEMES[engine];
}
