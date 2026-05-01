"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SessionShell } from "./SessionShell";
import { ChallengeCard, StreamingChallengeCard } from "./ChallengeCard";
import { UserResponseBubble } from "./UserResponseBubble";
import { UserResponseInput } from "./UserResponseInput";
import { ScoreSummary } from "@/components/payloads/ScoreSummary";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/lib/stores/session";
import { postSSE } from "@/lib/streaming/client";
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
}: {
  session: SparkLearningSession;
  topics: SparkTopic[];
  initialTurns: SparkSessionTurn[];
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

  return (
    <>
      <SessionShell
        engine={session.engine}
        topics={topics}
        status={currentStatus}
        onComplete={complete}
      >
        <div className="flex flex-col gap-8 pb-6">
          {warning && (
            <div className="text-xs text-amber-700 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50">
              {warning}
            </div>
          )}

          {turns.length === 0 && status !== "streaming" && (
            <div className="text-sm text-muted-foreground italic">
              Spark está preparando la sesión…
            </div>
          )}

          {turns.map((turn) => {
            if (turn.role === "user") {
              return <UserResponseBubble key={turn.id} text={turn.content} />;
            }
            return (
              <ChallengeCard
                key={turn.id}
                text={turn.content}
                payload={turn.payload}
              />
            );
          })}

          {status === "streaming" && (
            <StreamingChallengeCard text={streamingText} />
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
      </SessionShell>

      {currentStatus === "active" && (
        <UserResponseInput
          value={input}
          onChange={setInput}
          onSubmit={send}
          disabled={status === "streaming" || status === "completing"}
          placeholder={
            status === "streaming"
              ? "Spark está escribiendo…"
              : "Tu respuesta…"
          }
        />
      )}
    </>
  );
}
