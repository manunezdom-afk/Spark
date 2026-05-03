import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, RefreshCw, Home, Brain } from "lucide-react";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSession, getSessionTurns, getTopicsByIds } from "@/lib/spark/queries";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

import type { TestQuestionsPayload, TestResultPayload } from "@/modules/spark/types";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ sessionId: string }> };

export default async function TestResultsPage({ params }: RouteParams) {
  const { sessionId } = await params;
  const db = await getSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");

  const session = await getSession(db, sessionId);
  if (!session || session.user_id !== user.id) notFound();

  if (session.status !== "completed") {
    redirect(`/tests/${sessionId}/take`);
  }

  const turns = await getSessionTurns(db, sessionId);
  const questionsTurn = turns.find((t) => t.payload?.type === "test_questions");
  const resultTurn = turns.find((t) => t.payload?.type === "test_result");

  if (!questionsTurn?.payload || !resultTurn?.payload) notFound();

  const qPayload = questionsTurn.payload as TestQuestionsPayload;
  const rPayload = resultTurn.payload as TestResultPayload;
  const topics = await getTopicsByIds(db, session.topic_ids);

  const pct = rPayload.score;
  const correctCount = rPayload.question_results.filter((r) => r.correct).length;
  const total = qPayload.questions.length;

  const scoreColor =
    pct >= 70 ? "text-emerald-600" : pct >= 50 ? "text-amber-500" : "text-red-500";
  const scoreBorder =
    pct >= 70 ? "border-emerald-200" : pct >= 50 ? "border-amber-200" : "border-red-200";
  const scoreBg =
    pct >= 70 ? "bg-emerald-50" : pct >= 50 ? "bg-amber-50/70" : "bg-red-50/60";
  const typeLabel =
    qPayload.test_type === "alternativas" ? "Alternativas" : "Desarrollo";

  return (
    <div className="p-6 md:p-10 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
          {topics.map((t) => t.title).join(" · ")}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Resultado</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Prueba de {typeLabel} · {total} preguntas
        </p>
      </div>

      {/* Score card */}
      <div
        className={cn(
          "rounded-2xl border p-8 mb-8 text-center",
          scoreBorder,
          scoreBg
        )}
      >
        <div className={cn("text-6xl font-bold tabular-nums mb-1", scoreColor)}>
          {pct}
        </div>
        <div className="text-base text-foreground/50 mb-2">puntos de 100</div>
        {qPayload.test_type === "alternativas" && (
          <div className="text-sm text-foreground/60">
            {correctCount} de {total} preguntas correctas
          </div>
        )}
        <p className="mt-4 text-sm text-foreground/70 max-w-sm mx-auto leading-relaxed">
          {rPayload.feedback}
        </p>
      </div>

      {/* Per-question breakdown */}
      <section className="mb-8">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4">
          Desglose por pregunta
        </h2>
        <div className="flex flex-col gap-3">
          {qPayload.questions.map((q, i) => {
            const result = rPayload.question_results.find((r) => r.question_id === q.id);
            if (!result) return null;
            return (
              <div
                key={q.id}
                className={cn(
                  "rounded-xl border p-4",
                  result.correct
                    ? "border-emerald-100 bg-emerald-50/40"
                    : "border-red-100/80 bg-red-50/20"
                )}
              >
                <div className="flex items-start gap-3">
                  {result.correct ? (
                    <CheckCircle2
                      className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0"
                      strokeWidth={1.75}
                    />
                  ) : (
                    <XCircle
                      className="w-4 h-4 text-red-400 mt-0.5 shrink-0"
                      strokeWidth={1.75}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        Pregunta {i + 1}
                      </span>
                      {qPayload.test_type === "desarrollo" && (
                        <span
                          className={cn(
                            "font-mono text-[10px]",
                            result.correct ? "text-emerald-600" : "text-red-400"
                          )}
                        >
                          {result.score}/100
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground/80 mb-2 leading-snug">
                      {q.text}
                    </p>
                    <p className="text-xs text-foreground/60 leading-relaxed">
                      {result.feedback}
                    </p>
                    {/* Correct answer for wrong alternativas */}
                    {!result.correct && result.correct_answer && (
                      <div className="mt-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1.5">
                        Respuesta correcta: {result.correct_answer}
                      </div>
                    )}
                    {/* Explanation if available */}
                    {!result.correct && q.explanation && (
                      <div className="mt-2 text-xs text-muted-foreground bg-black/[0.02] border border-black/[0.05] rounded-lg px-3 py-1.5">
                        {q.explanation}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {correctCount < total && (
          <Button asChild variant="spark" className="gap-2 w-full">
            <Link
              href={`/sessions/new?topic_ids=${session.topic_ids.join(",")}&engine=socratic`}
            >
              <Brain className="w-4 h-4" strokeWidth={1.5} />
              Repasar errores con preguntas guiadas
            </Link>
          </Button>
        )}
        <div className="flex gap-3">
          <Button asChild variant="outline" className="flex-1 gap-2">
            <Link href="/tests/new">
              <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
              Nueva prueba
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1 gap-2">
            <Link href="/dashboard">
              <Home className="w-4 h-4" strokeWidth={1.5} />
              Inicio
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
