"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { postSSE } from "@/lib/streaming/client";
import { validatePayloadForEngine } from "@/modules/spark/types/payload-guards";
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completionScore, setCompletionScore] = useState<ScorePayload | null>(null);
  const kickedOffRef = useRef(false);
  // Remember the last message + opts so the user can retry without us
  // re-persisting a duplicate user turn or losing the synthetic flag.
  const lastSendRef = useRef<{
    content: string;
    opts: { synthetic?: boolean };
  } | null>(null);

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

      lastSendRef.current = { content: trimmed, opts };
      setStatus("streaming");
      setStreamingText("");
      setWarning(null);
      setErrorMessage(null);

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
            // Validate the payload against the engine's expected shape
            // before letting it reach the experience. If the model emits
            // something missing required fields, surface a warning the
            // experience renders instead of silently rendering broken UI.
            const validated = validatePayloadForEngine(session.engine, data);
            if (validated) {
              lastPayload = validated;
            } else {
              lastPayload = null;
              const msg =
                "Nova devolvió una respuesta sin el formato esperado. Reintenta en un momento.";
              setWarning(msg);
              toast.warning(msg, { duration: 6000 });
            }
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
            // Surface the message in the UI (banner inside the experience)
            // instead of relying on the toast alone — toasts auto-dismiss
            // and the user lost the trail of what happened.
            toast.error(data.message);
            setErrorMessage(data.message);
            setStatus("error");
            setStreamingText("");
          },
        },
      );

      return { payload: lastPayload, turn: assistantTurn };
    },
    [session.id, session.engine, status],
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

  const retry = useCallback(async () => {
    const last = lastSendRef.current;
    if (!last) return;
    if (status === "streaming" || status === "completing") return;
    // We deliberately reuse send() so the server picks up the next
    // turn_index from the live DB state. The user turn may have been
    // persisted on the failed attempt — that's accepted; the alternative
    // (a dedicated retry endpoint) is more code for a rare edge case.
    await send(last.content, last.opts);
  }, [send, status]);

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
    errorMessage,
    canRetry: status === "error" && lastSendRef.current !== null,
    completionScore,
    send,
    retry,
    complete,
    exit,
    lastAssistantTurn,
    userTurnsCount,
    assistantTurnsCount,
    isCompleted: completionScore !== null || session.status === "completed",
  };
}

export type SessionEngine = ReturnType<typeof useSessionEngine>;
