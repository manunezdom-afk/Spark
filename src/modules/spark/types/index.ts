// ── Core domain types for the Spark learning engine ─────────

export type LearningEngine =
  | 'debugger'
  | 'devils_advocate'
  | 'roleplay'
  | 'bridge_builder'
  | 'socratic';

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

// ── Supabase row shapes ──────────────────────────────────────

export interface SparkUserContext {
  id: string;
  user_id: string;
  career: string | null;
  current_role: string | null;
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
  engine: LearningEngine;
  status: SessionStatus;
  persona: string | null;
  scenario: string | null;
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
  | ScorePayload;

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
}
