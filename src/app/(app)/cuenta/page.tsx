"use client";

import { useEffect, useState } from "react";
import { LogOut, Download, Zap, BookOpen, Calendar } from "lucide-react";
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
        <h1 className="text-4xl font-semibold tracking-tight">
          Tu <span className="italic text-nova-mid">cuenta.</span>
        </h1>
      </header>

      {/* Identity */}
      <section className="flex flex-col gap-3 mb-8">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Identidad
        </div>
        <div className="p-4 rounded-md border border-white/[0.06] bg-white/[0.02]">
          <div className="text-sm">{user?.email}</div>
        </div>
      </section>

      {/* Context */}
      {ctx && (
        <section className="flex flex-col gap-3 mb-8">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Tu perfil de aprendizaje
          </div>
          <div className="p-4 rounded-md border border-white/[0.06] bg-white/[0.02] flex flex-col gap-2">
            {ctx.career && (
              <div className="text-sm">
                <span className="text-muted-foreground">Carrera: </span>
                {ctx.career}
              </div>
            )}
            {ctx.user_role && (
              <div className="text-sm">
                <span className="text-muted-foreground">Rol: </span>
                {ctx.user_role}
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
                <span className="text-muted-foreground">Proyectos activos: </span>
                {ctx.active_projects.length}
              </div>
            )}
          </div>
          <Button asChild variant="outline" size="sm" className="self-start">
            <a href="/onboarding">Editar perfil</a>
          </Button>
        </section>
      )}

      {/* PWA Install */}
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

      {/* Sign out */}
      <section className="pt-6 border-t border-white/[0.06] mb-12">
        <Button onClick={signOut} variant="ghost">
          <LogOut className="w-4 h-4" strokeWidth={1.5} />
          Cerrar sesión
        </Button>
      </section>

      {/* Focus OS ecosystem footer */}
      <footer className="border-t border-white/[0.04] pt-8">
        <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/40 mb-4">
          Familia Focus OS
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-spark/10 border border-spark/20 flex items-center justify-center">
              <Zap className="w-3 h-3 text-spark" strokeWidth={1.5} fill="currentColor" />
            </div>
            <div>
              <div className="text-xs font-medium">Spark</div>
              <div className="text-[9px] text-muted-foreground/40">Entrenamiento</div>
            </div>
          </div>
          <div className="flex items-center gap-2 opacity-40">
            <div className="w-6 h-6 rounded-md bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
              <BookOpen className="w-3 h-3 text-nova-mid" strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-xs font-medium">Kairos</div>
              <div className="text-[9px] text-muted-foreground/40">Notas</div>
            </div>
          </div>
          <div className="flex items-center gap-2 opacity-40">
            <div className="w-6 h-6 rounded-md bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
              <Calendar className="w-3 h-3 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-xs font-medium">Focus</div>
              <div className="text-[9px] text-muted-foreground/40">Calendario</div>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground/30 mt-4 leading-relaxed">
          Tus datos son compartidos de forma segura entre las apps del ecosistema. Una sola cuenta para todo.
        </p>
      </footer>
    </div>
  );
}
