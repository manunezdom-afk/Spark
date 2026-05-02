"use client";

import { GuidedQuestionsExperience } from "./experiences/GuidedQuestionsExperience";
import { HuntErrorsExperience } from "./experiences/HuntErrorsExperience";
import { DefendPostureExperience } from "./experiences/DefendPostureExperience";
import { ConnectThemesExperience } from "./experiences/ConnectThemesExperience";
import { RealCaseExperience } from "./experiences/RealCaseExperience";
import type {
  SparkLearningSession,
  SparkSessionTurn,
  SparkTopic,
} from "@/modules/spark/types";

/**
 * Routes a session to the experience component that owns its mechanic.
 * Each experience builds its own SessionShell + HUD + interaction model
 * — there is NO shared chat layout. The only thing they share is the
 * AI engine hook (useSessionEngine) and the SessionShell chrome.
 *
 * The two test engines have their own dedicated route under /tests/* and
 * never reach this renderer; we render an explanatory message in case
 * the route is hit by accident.
 */
export function MethodRenderer({
  session,
  topics,
  initialTurns,
}: {
  session: SparkLearningSession;
  topics: SparkTopic[];
  initialTurns: SparkSessionTurn[];
}) {
  switch (session.engine) {
    case "socratic":
      return (
        <GuidedQuestionsExperience
          session={session}
          topics={topics}
          initialTurns={initialTurns}
        />
      );
    case "debugger":
      return (
        <HuntErrorsExperience
          session={session}
          topics={topics}
          initialTurns={initialTurns}
        />
      );
    case "devils_advocate":
      return (
        <DefendPostureExperience
          session={session}
          topics={topics}
          initialTurns={initialTurns}
        />
      );
    case "bridge_builder":
      return (
        <ConnectThemesExperience
          session={session}
          topics={topics}
          initialTurns={initialTurns}
        />
      );
    case "roleplay":
      return (
        <RealCaseExperience
          session={session}
          topics={topics}
          initialTurns={initialTurns}
        />
      );
    case "test_alternativas":
    case "test_desarrollo":
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md text-center text-sm text-muted-foreground">
            Las pruebas usan el flujo de evaluación dedicado.{" "}
            <a
              href={`/tests/${session.id}/take`}
              className="text-spark underline-offset-2 hover:underline"
            >
              Ir a la prueba
            </a>
            .
          </div>
        </div>
      );
    default: {
      const exhaustive: never = session.engine;
      void exhaustive;
      return null;
    }
  }
}
