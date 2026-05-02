"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MethodSessionShell, type SessionMeter } from "./MethodSessionShell";
import { MethodChallengeCard, MethodStreamingCard } from "./MethodChallengeCard";
import { UserResponseBubble } from "./UserResponseBubble";
import { MethodResponseInput } from "./MethodResponseInput";
import { MethodIntroStage } from "./MethodIntroStage";
import { ScoreSummary } from "@/components/payloads/ScoreSummary";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/lib/stores/session";
import { postSSE } from "@/lib/streaming/client";
import { getEngineTheme } from "@/modules/spark/engines/themes";
import { getMethodPersonality } from "@/modules/spark/engines/personalities";
import type {
  SparkLearningSession,
  SparkSessionTurn,
  SparkTopic,
  ScorePayload,
  TurnPayload,
} from "@/modules/spark/types";

export function SessionView({
  session,
  topics,
  initialTurns,
  selectedMaterials = [],
}: {
  session: SparkLearningSession;
  topics: SparkTopic[];
  initialTurns: SparkSessionTurn[];
  /** Resolved titles of session.selected_note_ids — empty = full subject. */
  selectedMaterials?: { id: string; title: string }[];
}) {
  const router = useRouter();
  const {
    turns,
    streamingText,
    status,
    warning,
    setTurns,
    appendTurn,
    appendStreamingChunk,
    resetStreaming,
    setStatus,
    setWarning,
    upsertAssistantTurn,
    applyPayload,
  } = useSessionStore();

  const theme = getEngineTheme(session.engine);
  const personality = getMethodPersonality(session.engine);
  const [input, setInput] = useState("");
  const [completionScore, setCompletionScore] = useState<ScorePayload | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTurns(initialTurns);
    return () => {
      // do not clear on unmount: turn list belongs to the session id
    };
  }, [initialTurns, setTurns]);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [turns.length, streamingText]);

  // Auto-fire the first assistant turn if conversation is empty
  useEffect(() => {
    if (initialTurns.length === 0 && status === "idle" && session.status === "active") {
      void sendKickoff();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendKickoff() {
    setStatus("streaming");
    resetStreaming();
    setWarning(null);
    let lastAssistantTurnId: string | null = null;
    let lastPayload: TurnPayload | null = null;
    await postSSE(
      `/api/sessions/${session.id}/message`,
      {
        session_id: session.id,
        content: "[Inicio] Comienza la sesión según tu rol y contexto.",
      },
      {
        "user-turn": (data) => {
          // we don't show the synthetic kickoff turn
          void data;
        },
        "text-delta": (data) => {
          appendStreamingChunk(data.chunk);
        },
        payload: (data) => {
          lastPayload = data as TurnPayload;
        },
        warning: (data) => {
          setWarning(data.message);
        },
        done: (data) => {
          const turn = (data as { turn: SparkSessionTurn }).turn;
          lastAssistantTurnId = turn.id;
          appendTurn(turn);
          if (lastPayload && lastAssistantTurnId) {
            applyPayload(lastAssistantTurnId, lastPayload);
          }
          resetStreaming();
          setStatus("idle");
        },
        error: (data) => {
          toast.error(data.message);
          setStatus("error");
          resetStreaming();
        },
      }
    );
  }

  async function send() {
    if (!input.trim() || status === "streaming") return;
    const content = input.trim();
    setInput("");
    setStatus("streaming");
    resetStreaming();
    setWarning(null);

    let lastPayload: TurnPayload | null = null;

    await postSSE(
      `/api/sessions/${session.id}/message`,
      { session_id: session.id, content },
      {
        "user-turn": (data) => {
          appendTurn(data as SparkSessionTurn);
        },
        "text-delta": (data) => {
          appendStreamingChunk(data.chunk);
        },
        payload: (data) => {
          lastPayload = data as TurnPayload;
        },
        warning: (data) => {
          setWarning(data.message);
        },
        done: (data) => {
          const turn = (data as { turn: SparkSessionTurn }).turn;
          upsertAssistantTurn({ ...turn, payload: lastPayload ?? turn.payload });
          resetStreaming();
          setStatus("idle");
        },
        error: (data) => {
          toast.error(data.message);
          setStatus("error");
          resetStreaming();
        },
      }
    );
  }

  async function complete() {
    if (status === "streaming") return;
    if (turns.filter((t) => t.role === "user").length === 0) {
      toast.error("Necesitas responder al menos una vez antes de finalizar.");
      return;
    }
    setStatus("completing");
    try {
      const res = await fetch(`/api/sessions/${session.id}/complete`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Error");
      setCompletionScore(body.score as ScorePayload);
      setStatus("idle");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al evaluar");
      setStatus("idle");
    }
  }

  const currentStatus =
    completionScore || session.status === "completed"
      ? "completed"
      : session.status === "abandoned"
      ? "abandoned"
      : "active";

  const meter: SessionMeter = useMemo(() => {
    return computeMeter({
      engine: session.engine,
      turns,
      isCompleted: currentStatus === "completed",
      maxPhases: personality.hudMaxPhases ?? 4,
    });
  }, [session.engine, turns, currentStatus, personality.hudMaxPhases]);

  // Index assistant turns so we can show "Capa 1", "Round 2", etc.
  const assistantIndexById = useMemo(() => {
    const map = new Map<string, number>();
    let i = 0;
    for (const t of turns) {
      if (t.role === "assistant") {
        map.set(t.id, i);
        i++;
      }
    }
    return map;
  }, [turns]);

  const lastAssistantId = useMemo(() => {
    for (let i = turns.length - 1; i >= 0; i--) {
      if (turns[i].role === "assistant") return turns[i].id;
    }
    return null;
  }, [turns]);

  return (
    <>
      <MethodSessionShell
        engine={session.engine}
        topics={topics}
        status={currentStatus}
        meter={meter}
        onComplete={complete}
      >
        <div className="flex flex-col gap-7 pb-6">
          <MethodIntroStage
            engine={session.engine}
            theme={theme}
            topics={topics}
            persona={session.persona}
            scenario={session.scenario}
            selectedMaterials={selectedMaterials}
          />

          {warning && (
            <div className="text-xs text-amber-700 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50">
              {warning}
            </div>
          )}

          {turns.length === 0 && status !== "streaming" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground italic px-1">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: theme.accent }}
              />
              {personality.loadingHint}
            </div>
          )}

          {turns.map((turn) => {
            if (turn.role === "user") {
              return (
                <UserResponseBubble
                  key={turn.id}
                  text={turn.content}
                  engine={session.engine}
                />
              );
            }
            const idx = assistantIndexById.get(turn.id) ?? 0;
            return (
              <MethodChallengeCard
                key={turn.id}
                text={turn.content}
                payload={turn.payload}
                engine={session.engine}
                index={idx}
                isLast={turn.id === lastAssistantId}
              />
            );
          })}

          {status === "streaming" && (
            <MethodStreamingCard text={streamingText} engine={session.engine} />
          )}

          {completionScore && (
            <div className="p-6 rounded-2xl border border-spark/25 bg-spark/[0.04]">
              <ScoreSummary payload={completionScore} />
              <div className="flex justify-end gap-2 pt-6 mt-6 border-t border-black/[0.06]">
                <Button onClick={() => router.push("/dashboard")} variant="outline">
                  Volver al inicio
                </Button>
                <Button
                  onClick={() => router.push(`/topics/${session.topic_ids[0]}`)}
                  variant="spark"
                >
                  Ver tema
                </Button>
              </div>
            </div>
          )}

          <div ref={transcriptRef} />
        </div>
      </MethodSessionShell>

      {currentStatus === "active" && (
        <MethodResponseInput
          value={input}
          onChange={setInput}
          onSubmit={send}
          disabled={status === "streaming" || status === "completing"}
          engine={session.engine}
          overridePlaceholder={
            status === "streaming" ? "Nova está escribiendo…" : undefined
          }
        />
      )}
    </>
  );
}

/**
 * Method-specific meter computation. Each method maps the session
 * state (turn count, payloads found, etc.) to:
 *   • progress : top rail fill (0–1)
 *   • phase    : index into hudPhases (0..N-1)
 *   • meter    : 0–1 secondary metric (precisión, solidez, etc.)
 *   • badge    : optional "X / Y" label
 *
 * Logic is heuristic — we don't have ground truth from the model
 * mid-session, so we infer from turn count + the latest payloads.
 */
function computeMeter({
  engine,
  turns,
  isCompleted,
  maxPhases,
}: {
  engine: SparkLearningSession["engine"];
  turns: SparkSessionTurn[];
  isCompleted: boolean;
  maxPhases: number;
}): SessionMeter {
  const userTurns = turns.filter((t) => t.role === "user").length;
  const assistantTurns = turns.filter((t) => t.role === "assistant").length;

  // Default linear progress
  const baseProgress = isCompleted
    ? 1
    : Math.min(0.92, 0.06 + userTurns * 0.16);

  // Phase index by user turns (each turn = next phase, capped)
  const basePhase = Math.min(userTurns, maxPhases - 1);

  // Find the most recent payload to inform method-specific metrics
  const lastAssistant = [...turns].reverse().find((t) => t.role === "assistant");
  const lastPayload = lastAssistant?.payload ?? null;

  // ── Debugger: precision & errors ───────────────────────────
  if (engine === "debugger") {
    let plantedErrors = 0;
    let revealed = false;
    for (const t of turns) {
      if (t.role === "assistant" && t.payload?.type === "debugger") {
        plantedErrors = t.payload.errors.length;
        revealed = userTurns > 0; // user has answered → can reveal
      }
    }
    // Phase: 0 briefing, 1 caza, 2 veredicto
    const phase =
      plantedErrors === 0
        ? 0
        : !revealed
          ? 1
          : 2;
    const meterValue = isCompleted
      ? 1
      : revealed
        ? 0.85
        : plantedErrors > 0
          ? 0.4
          : 0.1;
    return {
      progress: isCompleted ? 1 : 0.1 + phase * 0.32,
      phase,
      meterValue,
      badge: plantedErrors > 0 ? `${plantedErrors} errores plantados` : undefined,
    };
  }

  // ── Devils advocate: rounds + solidity ─────────────────────
  if (engine === "devils_advocate") {
    // Phase 0 = postura, then each defended round counts up
    const phase = Math.min(userTurns, maxPhases - 1);
    const solidez =
      userTurns === 0 ? 0 : Math.min(1, 0.25 + userTurns * 0.22);
    return {
      progress: isCompleted ? 1 : 0.08 + phase * 0.28,
      phase,
      meterValue: isCompleted ? Math.max(solidez, 0.85) : solidez,
      badge: userTurns > 0 ? `Defensa #${userTurns}` : undefined,
    };
  }

  // ── Bridge builder: validated connections ──────────────────
  if (engine === "bridge_builder") {
    let nodeCount = 0;
    let edgeCount = 0;
    for (const t of turns) {
      if (t.role === "assistant" && t.payload?.type === "graph_node") {
        nodeCount = Math.max(nodeCount, t.payload.nodes.length);
        edgeCount = Math.max(edgeCount, t.payload.edges.length);
      }
    }
    const phase =
      assistantTurns <= 1
        ? 0
        : userTurns < 2
          ? 1
          : userTurns < 3
            ? 2
            : 3;
    const meterValue = isCompleted
      ? 1
      : edgeCount > 0
        ? Math.min(1, edgeCount / 4)
        : Math.min(0.7, 0.1 + userTurns * 0.18);
    return {
      progress: isCompleted ? 1 : 0.08 + phase * 0.27,
      phase,
      meterValue,
      badge:
        edgeCount > 0
          ? `${edgeCount} conexiones · ${nodeCount} nodos`
          : undefined,
    };
  }

  // ── Roleplay: scenario acts ────────────────────────────────
  if (engine === "roleplay") {
    const phase = Math.min(userTurns, maxPhases - 1);
    const meterValue = isCompleted
      ? 1
      : Math.min(0.9, userTurns * 0.22);
    return {
      progress: isCompleted ? 1 : 0.08 + phase * 0.26,
      phase,
      meterValue,
      badge: undefined,
    };
  }

  // ── Socratic: depth layers ─────────────────────────────────
  if (engine === "socratic") {
    const phase = Math.min(userTurns, maxPhases - 1);
    // Depth grows with conversation length
    const meterValue = isCompleted
      ? 1
      : Math.min(0.95, 0.1 + userTurns * 0.22);
    return {
      progress: isCompleted ? 1 : 0.08 + phase * 0.25,
      phase,
      meterValue,
      badge: undefined,
    };
  }

  // ── Default fallback ───────────────────────────────────────
  return {
    progress: baseProgress,
    phase: basePhase,
    meterValue: isCompleted ? 1 : Math.min(0.92, userTurns * 0.18),
    badge: undefined,
  };
  void lastPayload; // reserved for future enrichment
}
