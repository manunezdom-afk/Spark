"use client";

import { create } from "zustand";
import type { SparkSessionTurn, TurnPayload } from "@/modules/spark/types";

export type SessionStatus = "idle" | "streaming" | "completing" | "error";

interface SessionState {
  turns: SparkSessionTurn[];
  streamingText: string;
  status: SessionStatus;
  warning: string | null;

  setTurns: (turns: SparkSessionTurn[]) => void;
  appendTurn: (turn: SparkSessionTurn) => void;
  upsertAssistantTurn: (turn: SparkSessionTurn) => void;
  appendStreamingChunk: (chunk: string) => void;
  resetStreaming: () => void;
  setStatus: (status: SessionStatus) => void;
  setWarning: (warning: string | null) => void;
  applyPayload: (sessionTurnId: string, payload: TurnPayload) => void;
  clear: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  turns: [],
  streamingText: "",
  status: "idle",
  warning: null,

  setTurns: (turns) => set({ turns }),
  appendTurn: (turn) => set((s) => ({ turns: [...s.turns, turn] })),
  upsertAssistantTurn: (turn) =>
    set((s) => {
      const existing = s.turns.findIndex((t) => t.id === turn.id);
      if (existing >= 0) {
        const next = [...s.turns];
        next[existing] = turn;
        return { turns: next };
      }
      return { turns: [...s.turns, turn] };
    }),
  appendStreamingChunk: (chunk) =>
    set((s) => ({ streamingText: s.streamingText + chunk })),
  resetStreaming: () => set({ streamingText: "" }),
  setStatus: (status) => set({ status }),
  setWarning: (warning) => set({ warning }),
  applyPayload: (sessionTurnId, payload) =>
    set((s) => ({
      turns: s.turns.map((t) =>
        t.id === sessionTurnId ? { ...t, payload } : t
      ),
    })),
  clear: () =>
    set({ turns: [], streamingText: "", status: "idle", warning: null }),
}));
