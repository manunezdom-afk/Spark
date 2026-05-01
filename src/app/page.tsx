import Link from "next/link";
import {
  Zap,
  ArrowRight,
  BookOpen,
  Calendar,
  AlertTriangle,
  KeyRound,
} from "lucide-react";

export default function LandingPage() {
  const supabaseConfigured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const anthropicConfigured = !!process.env.ANTHROPIC_API_KEY;

  if (!supabaseConfigured || !anthropicConfigured) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-xl w-full flex flex-col gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-spark/10 border border-spark/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-spark" strokeWidth={1.5} fill="currentColor" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight leading-none text-foreground">
                Spark
              </div>
              <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60 mt-0.5 font-mono leading-none">
                Focus OS · Setup
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-200 bg-amber-50">
            <AlertTriangle
              className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"
              strokeWidth={1.75}
            />
            <div className="text-sm text-amber-800 leading-relaxed">
              <p className="font-semibold mb-1">Faltan credenciales para iniciar Spark.</p>
              <p>
                Crea un archivo <code className="font-mono text-[12px]">.env.local</code> en la
                raíz del proyecto con las claves indicadas abajo y vuelve a correr
                <code className="font-mono text-[12px]"> npm run dev</code>.
              </p>
            </div>
          </div>

          <ul className="flex flex-col gap-2.5">
            <SetupRow
              label="Supabase"
              configured={supabaseConfigured}
              hint="NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY"
            />
            <SetupRow
              label="Anthropic"
              configured={anthropicConfigured}
              hint="ANTHROPIC_API_KEY (necesaria para Nova y los métodos de estudio)"
            />
          </ul>

          <div className="rounded-2xl border border-black/[0.06] bg-white/60 p-5">
            <div className="flex items-center gap-2 mb-3">
              <KeyRound className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.75} />
              <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
                .env.local
              </p>
            </div>
            <pre className="text-[12px] leading-relaxed text-foreground/90 overflow-x-auto whitespace-pre">
{`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ANTHROPIC_API_KEY=sk-ant-...`}
            </pre>
            <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
              Encuentras tus claves de Supabase en Settings → API y la de Anthropic en
              console.anthropic.com → API Keys. Nada se commitea: <code className="font-mono">.env.local</code> está en el <code className="font-mono">.gitignore</code>.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-xl w-full flex flex-col gap-10">
        {/* App identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-spark/10 border border-spark/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-spark" strokeWidth={1.5} fill="currentColor" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight leading-none text-foreground">
              Spark
            </div>
            <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60 mt-0.5 font-mono leading-none">
              Focus OS
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-5xl font-semibold md:text-6xl leading-[1.05] tracking-tight text-foreground">
            No memorices.{" "}
            <span className="italic text-nova-mid">Entrena.</span>
          </h1>
          <p className="text-muted-foreground leading-relaxed text-lg max-w-md">
            Spark transforma tu material en sesiones de estudio activo: preguntas guiadas,
            cazar errores, debate, simulaciones, pruebas y repaso espaciado. Nova te coachea
            de punta a punta.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="group inline-flex items-center gap-2 rounded-full bg-spark px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-spark/90"
          >
            Empezar a entrenar
            <ArrowRight
              className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
              strokeWidth={1.5}
            />
          </Link>
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Ya tengo cuenta
          </Link>
        </div>

        {/* Ecosystem tag */}
        <div className="flex items-center gap-4 pt-4 border-t border-black/[0.06]">
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60 font-mono">
            Familia
          </span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[10px] text-foreground/70">
              <div className="w-3.5 h-3.5 rounded-sm bg-spark/10 border border-spark/20 flex items-center justify-center">
                <Zap className="w-2 h-2 text-spark" strokeWidth={1.5} fill="currentColor" />
              </div>
              Spark
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
              <div className="w-3.5 h-3.5 rounded-sm bg-black/[0.04] border border-black/[0.06] flex items-center justify-center">
                <BookOpen className="w-2 h-2 text-nova-mid" strokeWidth={1.5} />
              </div>
              Kairos
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
              <div className="w-3.5 h-3.5 rounded-sm bg-black/[0.04] border border-black/[0.06] flex items-center justify-center">
                <Calendar className="w-2 h-2 text-primary" strokeWidth={1.5} />
              </div>
              Focus
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function SetupRow({
  label,
  configured,
  hint,
}: {
  label: string;
  configured: boolean;
  hint: string;
}) {
  return (
    <li className="flex items-center justify-between gap-3 p-3 rounded-xl border border-black/[0.06] bg-white/60">
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            configured ? "bg-emerald-500" : "bg-amber-500"
          }`}
        />
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground">{label}</div>
          <div className="text-[11px] text-muted-foreground truncate">{hint}</div>
        </div>
      </div>
      <span
        className={`text-[10px] font-mono uppercase tracking-[0.14em] ${
          configured ? "text-emerald-600" : "text-amber-600"
        }`}
      >
        {configured ? "Listo" : "Falta"}
      </span>
    </li>
  );
}
