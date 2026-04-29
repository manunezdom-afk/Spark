import Link from "next/link";
import { Zap, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-xl w-full flex flex-col gap-10">
        <div className="flex items-center gap-3">
          <Zap className="w-7 h-7 text-spark" strokeWidth={1.5} />
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Spark · FOCUS OS
          </span>
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
            className="group inline-flex items-center gap-2 rounded-md bg-foreground/95 px-5 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground"
          >
            Empezar
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
          </Link>
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Ya tengo cuenta
          </Link>
        </div>
      </div>
    </main>
  );
}
