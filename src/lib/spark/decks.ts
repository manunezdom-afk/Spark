// Mock decks per study method. Each card has a `topic` so the practice screen
// can capture which topics the user struggles with and surface them as
// "debilidades detectadas" on the dashboard. Replaced by Nova-generated
// content once `/api/spark/generate` is wired.

import type { StudyMethod } from './methods';

export type DeckCard = {
  /** Short topic tag — used to detect weaknesses across sessions. */
  topic:    string;
  /** Question / prompt shown to the user. */
  front:    string;
  /** Answer or model response (flashcards / simulation / socratic). */
  back?:    string;
  /** Multiple-choice options (quiz only). Exactly one must be `correct`. */
  options?: { text: string; correct: boolean }[];
};

export const MOCK_DECKS: Record<StudyMethod, DeckCard[]> = {
  flashcards: [
    {
      topic: 'Espiral del silencio',
      front: '¿Qué postula la espiral del silencio de Noelle-Neumann?',
      back:  'Las personas tienden a callar opiniones que perciben como minoritarias, reforzando la opinión dominante.',
    },
    {
      topic: 'Aguja hipodérmica',
      front: '¿Qué sostiene el modelo de la aguja hipodérmica?',
      back:  'Que los medios "inyectan" mensajes directamente en una audiencia pasiva y homogénea — visión hoy superada.',
    },
    {
      topic: 'Two-step flow',
      front: '¿Qué describe el modelo de los dos pasos de Lazarsfeld y Katz?',
      back:  'La influencia mediática viaja primero a líderes de opinión y, a través de ellos, llega al resto de la audiencia.',
    },
    {
      topic: 'Agenda-setting',
      front: 'Define la teoría de la agenda-setting de McCombs y Shaw.',
      back:  'Los medios no nos dicen qué pensar, pero sí sobre qué pensar — establecen los temas relevantes del debate público.',
    },
    {
      topic: 'Industria cultural',
      front: '¿Qué entienden Adorno y Horkheimer por "industria cultural"?',
      back:  'La producción industrializada de bienes culturales que estandariza el consumo y homogeniza el pensamiento.',
    },
    {
      topic: 'Lasswell',
      front: 'Enuncia la fórmula del modelo de Lasswell.',
      back:  '¿Quién dice qué, en qué canal, a quién y con qué efecto?',
    },
  ],

  quiz: [
    {
      topic: 'Lasswell',
      front: 'El modelo de Lasswell describe el proceso comunicativo respondiendo a:',
      options: [
        { text: '¿Quién? → ¿Qué? → ¿A quién?',                              correct: false },
        { text: '¿Quién dice qué, en qué canal, a quién y con qué efecto?',  correct: true  },
        { text: '¿Por qué? → ¿Cómo? → ¿Cuándo?',                            correct: false },
      ],
    },
    {
      topic: 'Aguja hipodérmica',
      front: 'La crítica principal al modelo de la aguja hipodérmica es que:',
      options: [
        { text: 'Sobrestima el rol activo de la audiencia',     correct: false },
        { text: 'Asume una audiencia pasiva y homogénea',        correct: true  },
        { text: 'Ignora completamente los efectos mediáticos',   correct: false },
      ],
    },
    {
      topic: 'Espiral del silencio',
      front: 'En la espiral del silencio, las personas tienden a:',
      options: [
        { text: 'Expresar todas sus opiniones por igual',           correct: false },
        { text: 'Callar opiniones percibidas como minoritarias',     correct: true  },
        { text: 'Adoptar siempre la postura del medio dominante',   correct: false },
      ],
    },
    {
      topic: 'Agenda-setting',
      front: 'McCombs y Shaw plantean que los medios:',
      options: [
        { text: 'Determinan exactamente qué debe pensar el público', correct: false },
        { text: 'No tienen influencia significativa en la opinión',  correct: false },
        { text: 'Definen sobre qué temas piensa el público',         correct: true  },
      ],
    },
    {
      topic: 'Industria cultural',
      front: 'La "industria cultural" de Adorno y Horkheimer se refiere a:',
      options: [
        { text: 'El mercado del arte clásico de élite',                correct: false },
        { text: 'La producción industrializada de cultura masiva',     correct: true  },
        { text: 'La cultura tradicional de los pueblos originarios',   correct: false },
      ],
    },
  ],

  simulation: [
    {
      topic: 'Industria cultural',
      front: 'Define con tus palabras qué entiende la teoría crítica por "industria cultural" y da un ejemplo contemporáneo.',
      back:  'Producción industrializada de bienes culturales que homogeniza el pensamiento. Ej: algoritmos de recomendación que estandarizan el consumo.',
    },
    {
      topic: 'Espiral del silencio',
      front: 'Explica la espiral del silencio y aplícala a un fenómeno actual de redes sociales.',
      back:  'Las personas callan opiniones percibidas como minoritarias. Ej: usuarios que evitan opinar políticamente en plataformas donde perciben hostilidad mayoritaria.',
    },
    {
      topic: 'Agenda-setting',
      front: 'Diferencia agenda-setting de framing. Da un ejemplo de cada uno.',
      back:  'Agenda-setting define qué temas son importantes; framing define cómo se interpretan. Ej: cobertura de migración (agenda) vs presentarla como crisis o como oportunidad (frame).',
    },
    {
      topic: 'Lasswell vs Shannon',
      front: 'Compara el modelo de Lasswell con el de Shannon-Weaver. ¿Qué aporta cada uno?',
      back:  'Lasswell: foco en actores y efectos sociales. Shannon-Weaver: foco técnico en transmisión y ruido. Ambos lineales, distinto énfasis.',
    },
    {
      topic: 'Two-step flow',
      front: 'Describe el modelo de los dos pasos. ¿Por qué fue una ruptura con la aguja hipodérmica?',
      back:  'Los medios influyen primero en líderes de opinión, que luego median ante la audiencia. Rompe con la idea de audiencia pasiva y directa.',
    },
  ],

  socratic: [
    {
      topic: 'Aguja hipodérmica',
      front: '¿Por qué crees que la teoría de la aguja hipodérmica perdió vigencia en la investigación contemporánea?',
      back:  'No hay respuesta única. Cada respuesta tuya generará la siguiente pregunta — más profunda.',
    },
    {
      topic: 'Algoritmos',
      front: 'Si los algoritmos deciden qué vemos, ¿quién es realmente el comunicador en una red social?',
      back:  'Considera los roles: plataforma, usuario, editor, modelo predictivo. ¿Dónde reside la intencionalidad?',
    },
    {
      topic: 'Espiral del silencio',
      front: '¿La espiral del silencio se intensifica o se debilita en plataformas anónimas? ¿Por qué?',
      back:  'Considera: anonimato, percepción del clima de opinión, sesgo algorítmico, costos sociales.',
    },
    {
      topic: 'Posverdad',
      front: '¿Qué significa "verdad" en un ecosistema saturado de información? ¿Existe?',
      back:  'Considera epistemología, posverdad, autoridad cognitiva, sesgo de confirmación.',
    },
    {
      topic: 'Audiencia activa',
      front: 'Si la audiencia ya no es pasiva, ¿qué responsabilidad tiene en la información que circula?',
      back:  'Considera curaduría, viralización, sesgos de confirmación, esfera pública digital.',
    },
  ],
};
