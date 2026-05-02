"use client";

import { MethodRenderer } from "./MethodRenderer";
import type {
  SparkLearningSession,
  SparkSessionTurn,
  SparkTopic,
} from "@/modules/spark/types";

/**
 * Thin wrapper kept so existing routes (/sessions/[id]/page.tsx) don't
 * have to change. All the actual UX lives inside method-specific
 * experiences under `experiences/` — the chat-based shell is gone.
 *
 * The `selectedMaterials` prop used to drive the intro-stage chip list,
 * which is now embedded inside RealCaseExperience.ScenarioBriefing
 * when relevant. Other methods don't need the chip list, so we ignore
 * the field for them — the data is already part of `session`.
 */
export function SessionView({
  session,
  topics,
  initialTurns,
}: {
  session: SparkLearningSession;
  topics: SparkTopic[];
  initialTurns: SparkSessionTurn[];
  selectedMaterials?: { id: string; title: string }[];
}) {
  return (
    <MethodRenderer
      session={session}
      topics={topics}
      initialTurns={initialTurns}
    />
  );
}
