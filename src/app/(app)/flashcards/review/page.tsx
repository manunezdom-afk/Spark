import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getDueFlashcards } from "@/lib/spark/queries";
import { FlashcardReview } from "@/components/mastery/FlashcardReview";
import { PageHeader } from "@/components/layout/PageHeader";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const db = await getSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");

  const cards = await getDueFlashcards(db, user.id);

  return (
    <div className="w-full max-w-2xl mx-auto p-6 md:p-10 animate-fade-up">
      <PageHeader
        title="Repaso de tarjetas"
        description="Memorización espaciada con SM-2."
      />

      <FlashcardReview initial={cards} />
    </div>
  );
}
