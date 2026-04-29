import Link from "next/link";
import { Zap, ArrowRight, BookOpen, Calendar } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-xl w-full flex flex-col gap-10">
        {/* App identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-spark/10 border border-spark/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-spark" strokeWidth={1.5} fill="currentColor" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight leading-none">Spark</div>
            <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50 mt-0.5 font-mono leading-none">
              Focus OS
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-5xl font-semibold md:text-6xl leading-[1.05] tracking-tight">
            No memorices.{" "}
            <span className="italic text-nova-mid">Entrena.</span>
          </h1>
          <p className="text-muted-foreground leading-relaxed text-lg max-w-md">
            Cinco motores que te obligan a pensar. Spark detecta lo que no sabes
            y te lleva al borde de tu propio entendimiento.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="group inline-flex items-center gap-2 rounded-md bg-spark px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-spark/90"
          >
            Empezar a entrenar
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
          </Link>
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Ya tengo cuenta
          </Link>
        </div>

        {/* Ecosystem tag */}
        <div className="flex items-center gap-4 pt-4 border-t border-white/[0.04]">
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/30 font-mono">
            Familia
          </span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/30">
              <div className="w-3.5 h-3.5 rounded-sm bg-spark/10 border border-spark/20 flex items-center justify-center">
                <Zap className="w-2 h-2 text-spark" strokeWidth={1.5} fill="currentColor" />
              </div>
              Spark
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/20">
              <div className="w-3.5 h-3.5 rounded-sm bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                <BookOpen className="w-2 h-2 text-nova-mid/50" strokeWidth={1.5} />
              </div>
              Kairos
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/20">
              <div className="w-3.5 h-3.5 rounded-sm bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                <Calendar className="w-2 h-2 text-primary/50" strokeWidth={1.5} />
              </div>
              Focus
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
