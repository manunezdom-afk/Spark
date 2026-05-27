// Runtime guards for the JSON payloads Nova emits at the end of each
// assistant turn. The streaming route parses the JSON block and persists
// `payload` on the turn, but the SHAPE isn't enforced — the model can
// (and does, sometimes) omit fields. Without these guards every
// experience component ends up sprinkling `payload?.x ?? fallback`
// defensive reads, and a missing `closing_question` silently breaks the UI.
//
// Each guard checks the discriminator (`type`) and the fields the UI
// truly relies on. It does NOT enforce nested optional fields — the goal
// is "is this payload usable" not "is this payload pristine".

import type {
  BridgeProposalPayload,
  DebuggerPayload,
  DefendVolleyPayload,
  FlashcardPayload,
  LearningEngine,
  RoleplayScenePayload,
  ScorePayload,
  SocraticLayerPayload,
  TurnPayload,
} from "./index";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isStr(v: unknown): v is string {
  return typeof v === "string";
}

function isNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export function isSocraticLayer(p: unknown): p is SocraticLayerPayload {
  if (!isRecord(p) || p.type !== "socratic_layer") return false;
  return (
    (p.layer === 1 || p.layer === 2 || p.layer === 3 || p.layer === 4) &&
    isStr(p.question) &&
    p.question.length > 0
  );
}

export function isDebuggerPayload(p: unknown): p is DebuggerPayload {
  if (!isRecord(p) || p.type !== "debugger") return false;
  if (!isStr(p.text_with_errors) || p.text_with_errors.length === 0) return false;
  if (!Array.isArray(p.errors)) return false;
  return p.errors.every(
    (e) => isRecord(e) && isStr(e.correct_version) && isStr(e.explanation),
  );
}

export function isDefendVolley(p: unknown): p is DefendVolleyPayload {
  if (!isRecord(p) || p.type !== "defend_volley") return false;
  return (
    isNum(p.round) &&
    isStr(p.attack_label) &&
    isStr(p.objection) &&
    isStr(p.closing_question)
  );
}

export function isBridgeProposal(p: unknown): p is BridgeProposalPayload {
  if (!isRecord(p) || p.type !== "bridge_proposal") return false;
  return isNum(p.proposal_index);
}

export function isRoleplayScene(p: unknown): p is RoleplayScenePayload {
  if (!isRecord(p) || p.type !== "roleplay_scene") return false;
  return (
    (p.act === 1 || p.act === 2 || p.act === 3 || p.act === 4) &&
    isStr(p.scene_text) &&
    p.scene_text.length > 0
  );
}

export function isScorePayload(p: unknown): p is ScorePayload {
  if (!isRecord(p) || p.type !== "score") return false;
  return isNum(p.score) && isStr(p.feedback);
}

export function isFlashcardPayload(p: unknown): p is FlashcardPayload {
  if (!isRecord(p) || p.type !== "flashcard") return false;
  return (
    Array.isArray(p.cards) &&
    p.cards.every(
      (c) => isRecord(c) && isStr(c.front) && isStr(c.back),
    )
  );
}

// Maps a session engine to the guard that validates the assistant payloads
// it should produce. ScorePayload and FlashcardPayload are accepted in
// every engine because they can appear opportunistically — the score is
// emitted by /complete, and flashcards can show up in any session as a
// side-effect of Nova's reasoning.
export function validatePayloadForEngine(
  engine: LearningEngine,
  payload: unknown,
): TurnPayload | null {
  if (payload == null) return null;

  // Universally allowed payloads.
  if (isScorePayload(payload)) return payload;
  if (isFlashcardPayload(payload)) return payload;

  switch (engine) {
    case "socratic":
      return isSocraticLayer(payload) ? payload : null;
    case "debugger":
      return isDebuggerPayload(payload) ? payload : null;
    case "devils_advocate":
      return isDefendVolley(payload) ? payload : null;
    case "bridge_builder":
      return isBridgeProposal(payload) ? payload : null;
    case "roleplay":
      return isRoleplayScene(payload) ? payload : null;
    default:
      return null;
  }
}
