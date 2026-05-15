"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function KairosBridgeProvider() {
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function sync() {
      const res = await fetch("/api/bridge/kairos/sync", { method: "POST" });
      if (!res.ok) return;
      const body = (await res.json()) as {
        created: number;
        updated: number;
        deleted?: number;
      };
      if (body.created > 0 || body.updated > 0 || (body.deleted ?? 0) > 0) {
        if (body.created > 0) {
          toast.success(
            `Kairos sincronizado · ${body.created} ${body.created === 1 ? "materia nueva" : "materias nuevas"}`,
            { duration: 4000 },
          );
        } else if (body.updated > 0) {
          toast("Kairos actualizado · tus apuntes están al día", { duration: 3000 });
        }
        router.refresh();
      }
    }

    async function setup() {
      await sync();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Realtime: cuando Kairos guarda un nuevo snapshot, re-sincronizar
      channel = supabase
        .channel("kairos-bridge")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "kairos_snapshots",
            filter: `user_id=eq.${user.id}`,
          },
          () => sync(),
        )
        .subscribe();
    }

    setup().catch(() => {});

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
