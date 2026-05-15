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
      <header className="flex flex-col gap-1.5 mb-10">
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground">
          Repaso de tarjetas
        </h1>
        <p className="text-[14px] text-muted-foreground">
          Memorización espaciada con SM-2.
        </p>
      </header>

      <FlashcardReview initial={cards} />
    </div>
  );
}
