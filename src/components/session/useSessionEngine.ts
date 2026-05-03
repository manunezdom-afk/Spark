"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { postSSE } from "@/lib/streaming/client";
import type {
  ScorePayload,
  SparkLearningSession,
  SparkSessionTurn,
  TurnPayload,
} from "@/modules/spark/types";

export type EngineStatus = "idle" | "streaming" | "completing" | "error";

/**
 * Shared session engine. Each method-specific experience component
 * uses this to drive the AI loop without re-implementing the SSE
 * plumbing or the completion flow. The chat UI is gone; what remains
 * is the lifecycle: kickoff → send → done → complete.
 *
 * Returns the live transcript (used by experiences to interpret state)
 * plus actions. Experiences wrap the transcript in their own layout
 * (capas, rondas, decisiones, mapa, etc.), never as chat bubbles.
 */
export function useSessionEngine({
  session,
  initialTurns,
  autoKickoff = true,
}: {
  session: SparkLearningSession;
  initialTurns: SparkSessionTurn[];
  autoKickoff?: boolean;
}) {
  const router = useRouter();
  const [turns, setTurns] = useState<SparkSessionTurn[]>(initialTurns);
  const [streamingText, setStreamingText] = useState("");
  const [status, setStatus] = useState<EngineStatus>("idle");
  const [warning, setWarning] = useState<string | null>(null);
  const [completionScore, setCompletionScore] = useState<ScorePayload | null>(null);
  const kickedOffRef = useRef(false);

  // Reset when session id changes (route navigation)
  useEffect(() => {
    setTurns(initialTurns);
  }, [initialTurns]);

  const send = useCallback(
    async (
      content: string,
      opts: { synthetic?: boolean } = {},
    ): Promise<{ payload: TurnPayload | null; turn: SparkSessionTurn | null }> => {
      if (status === "streaming" || status === "completing") {
        return { payload: null, turn: null };
      }
      const trimmed = content.trim();
      if (!trimmed) return { payload: null, turn: null };

      setStatus("streaming");
      setStreamingText("");
      setWarning(null);

      let lastPayload: TurnPayload | null = null;
      let assistantTurn: SparkSessionTurn | null = null;

      await postSSE(
        `/api/sessions/${session.id}/message`,
        { session_id: session.id, content: trimmed },
        {
          "user-turn": (data) => {
            if (opts.synthetic) return; // kickoff turns aren't surfaced
            setTurns((prev) => [...prev, data as SparkSessionTurn]);
          },
          "text-delta": (data) => {
            setStreamingText((prev) => prev + data.chunk);
          },
          payload: (data) => {
            lastPayload = data as TurnPayload;
          },
          warning: (data) => {
            setWarning(data.message);
            // Surface as toast too so the user sees it regardless of
            // whether the active experience renders the warning state.
            // Used for rate-limit alerts and JSON parse warnings.
            toast.warning(data.message, { duration: 6000 });
          },
          done: (data) => {
            const turn = (data as { turn: SparkSessionTurn }).turn;
            assistantTurn = { ...turn, payload: lastPayload ?? turn.payload };
            setTurns((prev) => {
              const idx = prev.findIndex((t) => t.id === turn.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = assistantTurn!;
                return next;
              }
              return [...prev, assistantTurn!];
            });
            setStreamingText("");
            setStatus("idle");
          },
          error: (data) => {
            toast.error(data.message);
            setStatus("error");
            setStreamingText("");
          },
        },
      );

      return { payload: lastPayload, turn: assistantTurn };
    },
    [session.id, status],
  );

  // Auto-fire the first assistant turn when the conversation is empty.
  useEffect(() => {
    if (!autoKickoff) return;
    if (kickedOffRef.current) return;
    if (initialTurns.length > 0) return;
    if (session.status !== "active") return;
    kickedOffRef.current = true;
    void send("[Inicio] Comienza la sesión según tu rol y contexto.", {
      synthetic: true,
    });
  }, [autoKickoff, initialTurns.length, session.status, send]);

  const complete = useCallback(async () => {
    if (status === "streaming" || status === "completing") return;
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
  }, [session.id, status]);

  const exit = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  const lastAssistantTurn = [...turns].reverse().find((t) => t.role === "assistant");
  const userTurnsCount = turns.filter((t) => t.role === "user").length;
  const assistantTurnsCount = turns.filter((t) => t.role === "assistant").length;

  return {
    turns,
    streamingText,
    status,
    warning,
    completionScore,
    send,
    complete,
    exit,
    lastAssistantTurn,
    userTurnsCount,
    assistantTurnsCount,
    isCompleted: completionScore !== null || session.status === "completed",
  };
}

export type SessionEngine = ReturnType<typeof useSessionEngine>;
