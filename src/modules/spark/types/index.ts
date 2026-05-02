// ── Core domain types for the Spark learning engine ─────────

export type LearningEngine =
  | 'debugger'
  | 'devils_advocate'
  | 'roleplay'
  | 'bridge_builder'
  | 'socratic'
  | 'test_alternativas'
  | 'test_desarrollo';

export type TestType = 'alternativas' | 'desarrollo';

export interface TestQuestion {
  id: number;
  text: string;
  // For alternativas:
  options?: string[];          // ["A. ...", "B. ...", "C. ...", "D. ..."]
  correct_index?: number;      // 0-based index of correct option
  // For desarrollo:
  expected_concepts?: string[];
  // Shown after submission (both types):
  explanation?: string;
}

export interface TestAnswer {
  question_id: number;
  selected_index?: number;   // alternativas
  text_answer?: string;      // desarrollo
}

export interface TestQuestionResult {
  question_id: number;
  correct: boolean;
  score: number;             // 0-100
  feedback: string;
  correct_answer?: string;   // for alternativas: text of correct option
}

export interface TestResult {
  session_id: string;
  score: number;
  total_questions: number;
  correct_count: number;
  question_results: TestQuestionResult[];
  feedback: string;
}

export type SessionStatus = 'active' | 'completed' | 'abandoned';

export type ErrorType =
  | 'conceptual'
  | 'causal'
  | 'factual'
  | 'application'
  | 'omission';

export type LearningStyle =
  | 'visual'
  | 'auditory'
  | 'kinesthetic'
  | 'reading_writing';

/**
 * Configuración de sesión declarada por el usuario en /sessions/new.
 * Viaja al master system prompt para modular la actitud de Nova.
 */
export type SessionObjective =
  | 'comprender'
  | 'memorizar'
  | 'practicar'
  | 'preparar_prueba';

export type SessionIntensity = 'baja' | 'media' | 'alta';

// ── Supabase row shapes ──────────────────────────────────────

export interface SparkUserContext {
  id: string;
  user_id: string;
  career: string | null;
  user_role: string | null;
  active_projects: ActiveProject[];
  personal_goals: PersonalGoal[];
  learning_style: LearningStyle | null;
  custom_context: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActiveProject {
  name: string;
  type: string;
  deadline?: string;
}

export interface PersonalGoal {
  goal: string;
  category: string;
}

export interface SparkTopic {
  id: string;
  user_id: string;
  title: string;
  summary: string | null;
  source_note_ids: string[];
  tags: string[];
  category: string | null;
  is_archived: boolean;
  is_demo: boolean;
  kairos_subject_id: string | null;
  kairos_color: string | null;
  created_at: string;
  updated_at: string;
}

export interface SparkMasteryState {
  id: string;
  user_id: string;
  topic_id: string;
  mastery_score: number;         // 0–100
  ease_factor: number;           // SM-2: min 1.30
  interval_days: number;
  repetitions: number;
  last_reviewed_at: string | null;
  next_review_at: string;
  total_errors: number;
  total_sessions: number;
  created_at: string;
  updated_at: string;
}

export interface SparkLearningSession {
  id: string;
  user_id: string;
  topic_ids: string[];
  /**
   * Subset de IDs de Kairos sessions con los que se entrena. Vacío = usa
   * todo el material disponible en los topics. Permite estudiar una
   * subpágina/apunte concreto sin abarcar la materia completa.
   */
  selected_note_ids: string[];
  engine: LearningEngine;
  status: SessionStatus;
  persona: string | null;
  scenario: string | null;
  /** Objetivo elegido por el usuario al crear la sesión (null = no declarado). */
  objective: SessionObjective | null;
  /** Intensidad elegida por el usuario al crear la sesión (null = no declarada). */
  intensity: SessionIntensity | null;
  score: number | null;
  feedback: string | null;
  errors_found: DebuggerError[];
  nearest_deadline: string | null;
  days_to_deadline: number | null;
  started_at: string;
  ended_at: string | null;
  created_at: string;
}

export interface SparkSessionTurn {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  payload: TurnPayload | null;
  turn_index: number;
  created_at: string;
}

export interface SparkErrorPattern {
  id: string;
  user_id: string;
  topic_id: string | null;
  error_type: ErrorType;
  description: string;
  example: string | null;
  frequency: number;
  last_seen_at: string;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
}

export interface SparkFlashcard {
  id: string;
  user_id: string;
  topic_id: string | null;
  session_id: string | null;
  front: string;
  back: string;
  hint: string | null;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  last_reviewed_at: string | null;
  next_review_at: string;
  mastery_score: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

// ── JSON payloads (TurnPayload variants) ────────────────────
// Each engine produces a typed payload the UI can render
// without parsing free text.

export type TurnPayload =
  | FlashcardPayload
  | QuizPayload
  | DebuggerPayload
  | GraphNodePayload
  | ScorePayload
  | TestQuestionsPayload
  | TestResultPayload;

export interface TestQuestionsPayload {
  type: 'test_questions';
  test_type: TestType;
  questions: TestQuestion[];
}

export interface TestResultPayload {
  type: 'test_result';
  score: number;
  question_results: TestQuestionResult[];
  feedback: string;
}

export interface FlashcardPayload {
  type: 'flashcard';
  cards: { front: string; back: string; hint?: string }[];
}

export interface QuizPayload {
  type: 'quiz';
  question: string;
  expected_concepts: string[];       // used for auto-grading open answers
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface DebuggerPayload {
  type: 'debugger';
  text_with_errors: string;
  errors: DebuggerError[];           // revealed only after user attempts
}

export interface DebuggerError {
  id: number;
  position_hint: string;             // approximate sentence/paragraph
  correct_version: string;
  explanation: string;
}

export interface GraphNodePayload {
  type: 'graph_node';
  nodes: { label: string; category: string }[];
  edges: { source: string; target: string; relationship: string }[];
}

export interface ScorePayload {
  type: 'score';
  score: number;
  breakdown: { criterion: string; value: number }[];
  feedback: string;
}

// ── SM-2 input/output ────────────────────────────────────────
export interface SM2Input {
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  quality: number;                   // 0–5: user performance rating
}

export interface SM2Output {
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_at: Date;
}

// ── Engine request shapes ────────────────────────────────────
export interface CreateSessionRequest {
  topic_ids: string[];
  engine: LearningEngine;
  persona?: string;                  // required for roleplay
  scenario?: string;
  /**
   * Subset opcional de Kairos session IDs. Si se pasa vacío o no se
   * pasa, la sesión usa todo el material del topic.
   */
  selected_note_ids?: string[];
  /** Objetivo del usuario para esta sesión (modula a Nova). */
  objective?: SessionObjective;
  /** Intensidad para esta sesión (modula la presión). */
  intensity?: SessionIntensity;
}

// ── Material specificity (Kairos sessions inside a topic) ────
/**
 * A unit of study material that lives inside a Spark topic. Maps 1:1
 * to a Kairos session — what the user calls an "apunte" or "subpágina".
 * The picker on /sessions/new shows these so the user can scope the
 * session to a precise apunte instead of the whole subject.
 */
export interface TopicMaterial {
  id: string;                  // Kairos session id
  title: string;
  date: string | null;
  parent_id: string | null;    // null = top-level apunte; otherwise a subapunte
  block_count: number;         // number of useful blocks (concepto/def/resumen…)
  extraction_count: number;    // AI-extracted concepts/summaries
  has_children: boolean;       // tells the UI whether to show a "incluir subpáginas" hint
}

export interface SendMessageRequest {
  session_id: string;
  content: string;
}

export interface EngineContext {
  user: SparkUserContext;
  topics: SparkTopic[];
  mastery: SparkMasteryState[];
  error_patterns: SparkErrorPattern[];
  days_to_deadline: number | null;
  prior_turns: SparkSessionTurn[];
  /** Configuración declarada por el usuario al crear la sesión. */
  objective?: SessionObjective | null;
  intensity?: SessionIntensity | null;
}
