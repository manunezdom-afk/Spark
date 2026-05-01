"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

export interface NovaPageContext {
  surface: "dashboard" | "topic" | "session" | "mastery" | "review" | "test";
  topicId?: string;
  sessionId?: string;
  /** Etiqueta corta tipo "Cálculo II" o "Hoy". */
  scopeLabel: string;
  scopeDetail?: string;
}

const SURFACE_MAP: Record<string, NovaPageContext["surface"]> = {
  dashboard: "dashboard",
  topics: "topic",
  mastery: "mastery",
  flashcards: "review",
  tests: "test",
  sessions: "session",
};

const LABEL_MAP: Record<string, string> = {
  dashboard: "Tu día de estudio",
  topics: "Tus temas",
  mastery: "Tu maestría",
  flashcards: "Repaso de tarjetas",
  tests: "Pruebas",
  sessions: "Sesión activa",
};

export function useNovaContext(): NovaPageContext {
  const pathname = usePathname() ?? "/";
  const segments = pathname.split("/").filter(Boolean);
  const root = segments[0] ?? "dashboard";

  const topicId = root === "topics" && segments[1] ? segments[1] : undefined;
  const sessionId = root === "sessions" && segments[1] ? segments[1] : undefined;

  return React.useMemo<NovaPageContext>(() => {
    if (sessionId) {
      return {
        surface: "session",
        sessionId,
        scopeLabel: "Sesión activa",
        scopeDetail: "Spark Coach",
      };
    }
    if (topicId) {
      return {
        surface: "topic",
        topicId,
        scopeLabel: "Este tema",
      };
    }
    return {
      surface: SURFACE_MAP[root] ?? "dashboard",
      scopeLabel: LABEL_MAP[root] ?? "Spark",
    };
  }, [root, topicId, sessionId]);
}
