import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getDueFlashcards } from "@/lib/spark/queries";
import { FlashcardReview } from "@/components/mastery/FlashcardReview";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const db = await getSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");

  const cards = await getDueFlashcards(db, user.id);

  return (
    <div className="w-full max-w-2xl mx-auto p-6 md:p-10 animate-fade-up">
      <header className="flex flex-col gap-2 mb-10">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Spark · Repaso
        </span>
        <h1 className="text-4xl font-semibold tracking-tight">
          Memoria <span className="italic text-nova-mid">espaciada.</span>
        </h1>
      </header>

      <FlashcardReview initial={cards} />
    </div>
  );
}
