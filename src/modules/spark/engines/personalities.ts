// ── Method personalities ────────────────────────────────────────────
// Each chat-based learning method gets its own UX personality.
// The shell, intro, challenge card and input all read from here.
// `themes.ts` keeps the colors / motifs; this file owns the
// behavior + copy that makes each method feel like a different app.

import type { LearningEngine } from '../types';

/** Visual layout signature used by MethodSessionShell. */
export type ShellVariant =
  | 'depth'        // socratic: shows current depth layer 1..N
  | 'inspection'  // debugger: shows marked / found errors
  | 'duel'        // devils_advocate: shows round + argument strength
  | 'graph'       // bridge_builder: shows discovered connections
  | 'scenario'    // roleplay: shows act / stage of the case
  | 'rounds';     // generic fallback (counts user turns)

/** Hook visual + copy used in MethodIntroStage. */
export type IntroPersona =
  | 'mentor'      // socratic: mentor calmado, capas
  | 'detective'   // debugger: agente forense
  | 'rival'       // devils_advocate: rival con guantes
  | 'cartographer'// bridge_builder: explorador de mapas
  | 'director'    // roleplay: director de escena
  | 'examiner';   // tests: examinador estructurado

/** How Nova's turns render in the conversation. */
export type ChallengeVariant =
  | 'question'    // socratic: pregunta numerada
  | 'evidence'    // debugger: el texto contaminado se renderiza embebido
  | 'strike'      // devils_advocate: ataque marcado con tipo de objeción
  | 'proposal'    // bridge_builder: propuesta de conexión
  | 'beat'        // roleplay: línea del personaje en escena
  | 'plain';      // fallback simple

export interface MethodPersonality {
  /** Layout signature of the shell HUD. */
  shell: ShellVariant;
  /** Persona archetype for the intro stage. */
  intro: IntroPersona;
  /** How challenge cards render. */
  challenge: ChallengeVariant;

  /** Header chrome */
  hudKicker: string;          // small mono uppercase line
  hudTitle: string;            // e.g. "Capa", "Round", "Pista"
  hudPhases?: string[];        // labels for phases when shell uses phases
  hudMaxPhases?: number;       // total phases for progress display

  /** Intro / hero stage */
  introHook: string;           // bigger sentence above the rules
  introRules: string[];        // 2-3 short bullets of "cómo funciona"

  /** Nova streaming verbs (when waiting for the model) */
  thinkingLabel: string;       // "formulando…"
  loadingHint: string;         // shown while the first turn is generated

  /** Input personality */
  inputKicker: string;         // small uppercase tag above textarea
  inputPlaceholder: string;    // placeholder text
  inputCta: string;            // CTA button (icon stays the same)
  inputHint: string;           // small hint below the input

  /** Score / progress label per method */
  meterLabel?: string;         // "Solidez", "Aciertos", "Conexiones"
  meterDescription?: string;   // explanation tooltip-style

  /** Tone Nova should adopt — used by the system prompt builder */
  novaToneTag: string;
  novaToneDescription: string;
}

/** All chat-based methods. Test engines (alternativas/desarrollo) live in /tests/*. */
type ChatEngine = Exclude<LearningEngine, 'test_alternativas' | 'test_desarrollo'>;

const PERSONALITIES: Record<ChatEngine, MethodPersonality> = {
  socratic: {
    shell: 'depth',
    intro: 'mentor',
    challenge: 'question',

    hudKicker: 'Profundidad',
    hudTitle: 'Capa',
    hudPhases: ['Superficie', 'Causalidad', 'Límites', 'Síntesis'],
    hudMaxPhases: 4,

    introHook: 'Solo preguntas. Tú llegas a la respuesta.',
    introRules: [
      'Nova hace preguntas en capas, cada una más profunda.',
      'Si te trabas, puedes pedir una pista mínima.',
      'Al final quedan flashcards con tus brechas.',
    ],

    thinkingLabel: 'formulando pregunta',
    loadingHint: 'Nova está eligiendo por dónde empezar…',

    inputKicker: 'Tu razonamiento',
    inputPlaceholder: 'Responde con tu lógica, no con el dato.',
    inputCta: 'Responder',
    inputHint: 'Mejor pensar en voz alta que dar la respuesta corta.',

    meterLabel: 'Profundidad alcanzada',
    meterDescription: 'Cada capa exige una respuesta más estructurada.',

    novaToneTag: 'Mentor socrático',
    novaToneDescription:
      'Tono orientador, calmo y curioso. Empuja con preguntas, nunca afirma. Solo da pistas si el usuario lo pide explícitamente o lleva 2 intentos en blanco.',
  },

  debugger: {
    shell: 'inspection',
    intro: 'detective',
    challenge: 'evidence',

    hudKicker: 'Inspección',
    hudTitle: 'Errores',
    hudPhases: ['Briefing', 'Caza', 'Veredicto'],
    hudMaxPhases: 3,

    introHook: 'Hay 3 errores escondidos. Encuéntralos antes que Nova revele el veredicto.',
    introRules: [
      'Nova genera un texto plausible con errores plantados.',
      'Tú marcas oraciones sospechosas y explicas por qué.',
      'Al revelar, ves cuántos cazaste y dónde estaban los demás.',
    ],

    thinkingLabel: 'preparando trampas',
    loadingHint: 'Nova está plantando errores en el texto…',

    inputKicker: 'Tu reporte',
    inputPlaceholder: 'Indica qué oraciones marcaste y por qué.',
    inputCta: 'Enviar reporte',
    inputHint: 'Nombra el error y di qué debería decir.',

    meterLabel: 'Precisión',
    meterDescription: 'Errores cazados sobre errores plantados.',

    novaToneTag: 'Forense conceptual',
    novaToneDescription:
      'Tono agudo, retador y preciso. Habla como un editor que sabe dónde están las trampas. No revela errores hasta que el usuario marca.',
  },

  devils_advocate: {
    shell: 'duel',
    intro: 'rival',
    challenge: 'strike',

    hudKicker: 'Duelo',
    hudTitle: 'Round',
    hudPhases: ['Postura', 'Embate I', 'Embate II', 'Veredicto'],
    hudMaxPhases: 4,

    introHook: 'Tres rondas. Nova ataca tus premisas. Tú defiendes con tus notas.',
    introRules: [
      'Comienzas declarando la postura que defenderás.',
      'Nova ataca de la premisa más débil hacia las centrales.',
      'Cada round mide la solidez con la que respondes.',
    ],

    thinkingLabel: 'cargando contraataque',
    loadingHint: 'Nova está armando el primer ataque…',

    inputKicker: 'Tu defensa',
    inputPlaceholder: 'Defiende, matiza o reformula. No esquives.',
    inputCta: 'Sostener',
    inputHint: 'Cita evidencia concreta. Si concedes, dilo.',

    meterLabel: 'Solidez argumental',
    meterDescription: 'Sube cuando defiendes con evidencia. Baja si esquivas.',

    novaToneTag: 'Rival intelectual',
    novaToneDescription:
      'Tono confrontacional, incisivo y respetuoso. Ataca con contraejemplos reales, nunca con falacias. No cede hasta que el usuario apoye con evidencia.',
  },

  bridge_builder: {
    shell: 'graph',
    intro: 'cartographer',
    challenge: 'proposal',

    hudKicker: 'Síntesis',
    hudTitle: 'Conexión',
    hudPhases: ['Mapa', 'Hipótesis', 'Validación', 'Cierre'],
    hudMaxPhases: 4,

    introHook: 'Cruzas temas que parecían sueltos. Nova propone, tú validas.',
    introRules: [
      'Nova lanza una conexión no obvia entre tus temas.',
      'Tú la validas, refutas o extiendes con tu lógica.',
      'Cada conexión válida queda en el mapa final.',
    ],

    thinkingLabel: 'tendiendo el puente',
    loadingHint: 'Nova está leyendo los temas para encontrar el primer cruce…',

    inputKicker: 'Tu lectura',
    inputPlaceholder: 'Acepta, mata o extiende la conexión propuesta.',
    inputCta: 'Validar',
    inputHint: 'Si la conexión falla, di dónde se rompe.',

    meterLabel: 'Conexiones validadas',
    meterDescription: 'Cuenta cada relación que sostienes con evidencia.',

    novaToneTag: 'Cartógrafo conceptual',
    novaToneDescription:
      'Tono analítico y exploratorio. Lanza puentes específicos entre categorías; nunca conexiones genéricas. Pregunta por la mecánica que las une.',
  },

  roleplay: {
    shell: 'scenario',
    intro: 'director',
    challenge: 'beat',

    hudKicker: 'Escena',
    hudTitle: 'Acto',
    hudPhases: ['Apertura', 'Tensión', 'Decisión', 'Debrief'],
    hudMaxPhases: 4,

    introHook: 'Nova es el personaje. Tú resuelves con lo que sabes.',
    introRules: [
      'El personaje no rompe el rol para darte pistas.',
      'Solo avanzas si aplicas los conceptos correctamente.',
      'Al final Nova sale del rol y entrega un debrief.',
    ],

    thinkingLabel: 'entrando en personaje',
    loadingHint: 'Nova está entrando en personaje…',

    inputKicker: 'Tu jugada',
    inputPlaceholder: 'Habla con el personaje. Decide. Aplica lo que sabes.',
    inputCta: 'Decir',
    inputHint: 'No describas teoría. Actúa como en la situación real.',

    meterLabel: 'Avance del caso',
    meterDescription: 'Mide qué tanto resolviste la situación con los conceptos.',

    novaToneTag: 'Personaje inmersivo',
    novaToneDescription:
      'Habla 100% como el personaje que se le asignó. Aplica presión realista. Solo sale del rol al final, en el debrief, donde es directo y profesional.',
  },
};

/**
 * Test engines (alternativas + desarrollo) share a single examiner
 * personality. They have their own /tests/* runtime, but the
 * /sessions/new picker uses this personality to render the card and
 * the live summary panel consistently with the chat methods.
 */
const TEST_PERSONALITY: MethodPersonality = {
  shell: 'rounds',
  intro: 'examiner',
  challenge: 'plain',

  hudKicker: 'Evaluación',
  hudTitle: 'Pregunta',
  hudPhases: ['Planteamiento', 'Respuesta', 'Revisión'],
  hudMaxPhases: 3,

  introHook:
    'Spark genera una prueba con IA a partir de tus apuntes. Tú la respondes contra reloj y obtienes nota.',
  introRules: [
    'Elige formato: alternativas o preguntas de desarrollo.',
    'Spark prepara las preguntas con tus apuntes reales.',
    'Al terminar, ves nota, aciertos y dónde fallaste.',
  ],

  thinkingLabel: 'preparando preguntas',
  loadingHint: 'Spark está armando la prueba…',

  inputKicker: 'Tu respuesta',
  inputPlaceholder: '',
  inputCta: 'Enviar',
  inputHint: 'Responde con seguridad: la corrección es automática.',

  meterLabel: 'Aciertos',
  meterDescription: 'Preguntas resueltas correctamente sobre el total.',

  novaToneTag: 'Examinador estructurado',
  novaToneDescription:
    'Tono claro, neutral, evaluativo. Mide aciertos y errores de forma objetiva.',
};

export function getMethodPersonality(engine: LearningEngine): MethodPersonality {
  if (engine === 'test_alternativas' || engine === 'test_desarrollo') {
    return TEST_PERSONALITY;
  }
  return PERSONALITIES[engine];
}

export type { ChatEngine };
