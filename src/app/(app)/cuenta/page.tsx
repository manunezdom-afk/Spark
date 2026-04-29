"use client";

import { useEffect, useState } from "react";
import { LogOut, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSparkAuth } from "@/lib/auth/session";
import type { SparkUserContext } from "@/modules/spark/types";

export default function AccountPage() {
  const { user, signOut } = useSparkAuth();
  const [ctx, setCtx] = useState<SparkUserContext | null>(null);
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);

  useEffect(() => {
    fetch("/api/user-context")
      .then((r) => r.json())
      .then((d) => setCtx(d.context));
  }, []);

  useEffect(() => {
    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setInstallPrompt(e);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  async function install() {
    if (!installPrompt) return;
    // BeforeInstallPromptEvent is non-standard; cast to known shape.
    const e = installPrompt as Event & { prompt: () => Promise<void> };
    await e.prompt();
    setInstallPrompt(null);
  }

  return (
    <div className="p-6 md:p-10 max-w-2xl">
      <header className="flex flex-col gap-2 mb-10">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Spark · Cuenta
        </span>
        <h1 className="font-serif text-4xl tracking-tight">
          Tu <span className="italic text-nova-mid">configuración.</span>
        </h1>
      </header>

      <section className="flex flex-col gap-3 mb-8">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Identidad
        </div>
        <div className="p-4 rounded-md border border-white/[0.06] bg-white/[0.02]">
          <div className="text-sm">{user?.email}</div>
        </div>
      </section>

      {ctx && (
        <section className="flex flex-col gap-3 mb-8">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Contexto
          </div>
          <div className="p-4 rounded-md border border-white/[0.06] bg-white/[0.02] flex flex-col gap-2">
            {ctx.career && (
              <div className="text-sm">
                <span className="text-muted-foreground">Carrera: </span>
                {ctx.career}
              </div>
            )}
            {ctx.current_role && (
              <div className="text-sm">
                <span className="text-muted-foreground">Rol: </span>
                {ctx.current_role}
              </div>
            )}
            {ctx.learning_style && (
              <div className="text-sm">
                <span className="text-muted-foreground">Estilo: </span>
                {ctx.learning_style}
              </div>
            )}
            {ctx.active_projects.length > 0 && (
              <div className="text-sm">
                <span className="text-muted-foreground">Proyectos: </span>
                {ctx.active_projects.length}
              </div>
            )}
          </div>
          <Button asChild variant="outline" size="sm" className="self-start">
            <a href="/onboarding">Editar contexto</a>
          </Button>
        </section>
      )}

      {installPrompt && (
        <section className="flex flex-col gap-3 mb-8">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Aplicación
          </div>
          <Button onClick={install} variant="spark">
            <Download className="w-4 h-4" strokeWidth={1.5} />
            Instalar Spark en este dispositivo
          </Button>
        </section>
      )}

      <section className="pt-6 border-t border-white/[0.06]">
        <Button onClick={signOut} variant="ghost">
          <LogOut className="w-4 h-4" strokeWidth={1.5} />
          Cerrar sesión
        </Button>
      </section>
    </div>
  );
}
