import type { TurnPayload } from "@/modules/spark/types";
import { FlashcardCarousel } from "./FlashcardCarousel";
import { QuizCard } from "./QuizCard";
import { DebuggerInteractive } from "./DebuggerInteractive";
import { GraphView } from "./GraphView";
import { ScoreSummary } from "./ScoreSummary";

export function PayloadRenderer({ payload }: { payload: TurnPayload }) {
  switch (payload.type) {
    case "flashcard":
      return <FlashcardCarousel payload={payload} />;
    case "quiz":
      return <QuizCard payload={payload} />;
    case "debugger":
      return <DebuggerInteractive payload={payload} />;
    case "graph_node":
      return <GraphView payload={payload} />;
    case "score":
      return <ScoreSummary payload={payload} />;
    // Test payloads are rendered by dedicated test pages, not in chat
    case "test_questions":
    case "test_result":
      return null;
    // Defend volley payloads are rendered inline by DefendPostureExperience
    case "defend_volley":
      return null;
    // The remaining method-specific payloads render inline within their experience
    case "socratic_layer":
    case "bridge_proposal":
    case "roleplay_scene":
      return null;
    default: {
      const exhaustive: never = payload;
      void exhaustive;
      return null;
    }
  }
}
