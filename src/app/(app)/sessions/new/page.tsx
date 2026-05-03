"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlignLeft,
  ArrowRight,
  Brain,
  CheckSquare,
  ChevronLeft,
  Flame,
  Gauge,
  Layers,
  Sparkles,
  Target,
  Wand2,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ENGINE_LABELS, ENGINE_TAGS } from "@/modules/spark/engines";
import { getEngineTheme, type EngineTheme } from "@/modules/spark/engines/themes";
import { getMethodPersonality } from "@/modules/spark/engines/personalities";
import { TopicMaterialPicker } from "@/components/topics/TopicMaterialPicker";
import { cn } from "@/lib/utils/cn";
import type {
  LearningEngine,
  SessionIntensity,
  SessionObjective,
  SparkTopic,
  TestType,
} from "@/modules/spark/types";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────
// Method picker model
// ─────────────────────────────────────────────────────────────────
// The picker on this page renders 6 cards: 5 chat-based methods +
// "Generar prueba". The test card is virtual — it doesn't pin to a
// single engine; the user chooses alternativas vs desarrollo in the
// ajustes step. We use `MethodKey` as a thin abstraction so the
// component can branch on UI without touching the LearningEngine
// enum used by the API.

type MethodKey =
  | "socratic"
  | "debugger"
  | "devils_advocate"
  | "bridge_builder"
  | "roleplay"
  | "test";

const ALL_METHOD_KEYS: MethodKey[] = [
  "socratic",
  "debugger",
  "devils_advocate",
  "bridge_builder",
  "roleplay",
  "test",
];

const ENGINE_LIMITS: Record<MethodKey, { min: number; max: number }> = {
  debugger: { min: 1, max: 2 },
  devils_advocate: { min: 1, max: 1 },
  roleplay: { min: 1, max: 3 },
  bridge_builder: { min: 2, max: 6 },
  socratic: { min: 1, max: 2 },
  test: { min: 1, max: 5 },
};

const TEST_THEME_ENGINE: LearningEngine = "test_alternativas";

function methodKeyToThemeEngine(key: MethodKey): LearningEngine {
  return key === "test" ? TEST_THEME_ENGINE : (key as LearningEngine);
}

// METHOD_TAGS reutiliza ENGINE_TAGS (módulo compartido) — el método
// "test" es virtual y comparte tags con test_alternativas. Centralizar
// los tags ahí permite mostrarlos también en el landing público.
const METHOD_TAGS: Record<MethodKey, string[]> = {
  socratic: ENGINE_TAGS[methodKeyToThemeEngine("socratic")],
  debugger: ENGINE_TAGS[methodKeyToThemeEngine("debugger")],
  devils_advocate: ENGINE_TAGS[methodKeyToThemeEngine("devils_advocate")],
  bridge_builder: ENGINE_TAGS[methodKeyToThemeEngine("bridge_builder")],
  roleplay: ENGINE_TAGS[methodKeyToThemeEngine("roleplay")],
  test: ENGINE_TAGS[methodKeyToThemeEngine("test")],
};

function getMethodLabel(key: MethodKey): string {
  if (key === "test") return "Generar prueba";
  return ENGINE_LABELS[key as LearningEngine];
}

// ─────────────────────────────────────────────────────────────────
// Objective + intensity option metadata
// ─────────────────────────────────────────────────────────────────

interface OptionDef<T extends string> {
  value: T;
  label: string;
  description: string;
  Icon: LucideIcon;
}

const OBJECTIVES: OptionDef<SessionObjective>[] = [
  {
    value: "comprender",
    label: "Comprender",
    description: "Entender el porqué, no memorizar.",
    Icon: Brain,
  },
  {
    value: "memorizar",
    label: "Memorizar",
    description: "Fijar definiciones y datos clave.",
    Icon: Sparkles,
  },
  {
    value: "practicar",
    label: "Practicar",
    description: "Aplicar el concepto en casos reales.",
    Icon: Wand2,
  },
  {
    value: "preparar_prueba",
    label: "Preparar prueba",
    description: "Modo evaluación con presión real.",
    Icon: Target,
  },
];

const INTENSITIES: OptionDef<SessionIntensity>[] = [
  {
    value: "baja",
    label: "Baja",
    description: "Más calma. Más pistas.",
    Icon: Wind,
  },
  {
    value: "media",
    label: "Media",
    description: "Presión sostenida.",
    Icon: Gauge,
  },
  {
    value: "alta",
    label: "Alta",
    description: "Sin red. Sin atajos.",
    Icon: Flame,
  },
];

const TEST_TYPES: { value: TestType; label: string; description: string; Icon: LucideIcon }[] = [
  {
    value: "alternativas",
    label: "Alternativas",
    description: "Opción múltiple. Corrección automática.",
    Icon: CheckSquare,
  },
  {
    value: "desarrollo",
    label: "Desarrollo",
    description: "Preguntas abiertas evaluadas por IA.",
    Icon: AlignLeft,
  },
];

// ─────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────

function NewSessionForm() {
  const router = useRouter();
  const params = useSearchParams();

  const requestedEngine = params.get("engine") as LearningEngine | null;
  const initialMethod: MethodKey =
    requestedEngine === "test_alternativas" || requestedEngine === "test_desarrollo"
      ? "test"
      : requestedEngine && requestedEngine in ENGINE_LIMITS
        ? (requestedEngine as MethodKey)
        : "socratic";
  const presetTopic = params.get("topic");

  const [topics, setTopics] = useState<SparkTopic[]>([]);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(presetTopic ? [presetTopic] : []),
  );
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());
  const [methodKey, setMethodKey] = useState<MethodKey>(initialMethod);

  // Test-only state
  const [testType, setTestType] = useState<TestType>(
    requestedEngine === "test_desarrollo" ? "desarrollo" : "alternativas",
  );
  const [questionCount, setQuestionCount] = useState(10);

  // Chat-only state
  const [persona, setPersona] = useState("");
  const [scenario, setScenario] = useState("");

  // Shared session config
  const [objective, setObjective] = useState<SessionObjective>("comprender");
  const [intensity, setIntensity] = useState<SessionIntensity>("media");

  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const limits = ENGINE_LIMITS[methodKey];
  const themeEngine = methodKeyToThemeEngine(methodKey);
  const personality = useMemo(
    () => getMethodPersonality(themeEngine),
    [themeEngine],
  );
  const theme = useMemo(() => getEngineTheme(themeEngine), [themeEngine]);

  useEffect(() => {
    fetch("/api/topics")
      .then((r) => r.json())
      .then((data) => {
        setTopics(data.topics ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function toggleTopic(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else {
      if (selected.size >= limits.max) {
        toast.error(
          `Este método admite máximo ${limits.max} ${limits.max === 1 ? "materia" : "materias"}.`,
        );
        return;
      }
      next.add(id);
    }
    setSelected(next);
    setSelectedNoteIds(new Set());
  }

  function changeMethod(next: MethodKey) {
    setMethodKey(next);
    const nextLimits = ENGINE_LIMITS[next];
    if (selected.size > nextLimits.max) {
      const trimmed = new Set(Array.from(selected).slice(0, nextLimits.max));
      setSelected(trimmed);
      setSelectedNoteIds(new Set());
    }
  }

  function setObjectiveAndAdjust(next: SessionObjective) {
    setObjective(next);
    // Sensible default: "preparar prueba" usually goes with high
    // intensity, "memorizar" with low. The user can always override.
    if (next === "preparar_prueba" && intensity === "baja") setIntensity("alta");
    if (next === "memorizar" && intensity === "alta") setIntensity("baja");
  }

  const selectedTopics = useMemo(
    () => topics.filter((t) => selected.has(t.id)),
    [topics, selected],
  );
  const onlyTopic = selectedTopics.length === 1 ? selectedTopics[0] : null;

  // Step numbering: step 4 (ajustes) only counts if there's anything
  // configurable for the method. That's always true for chat methods
  // (objective + intensity) and for test (test type + count).
  const stepCount = onlyTopic ? 4 : 3;

  function canStart(): { ok: boolean; reason?: string } {
    if (loading) return { ok: false, reason: "Cargando temas…" };
    if (topics.length === 0)
      return { ok: false, reason: "Crea o importa un tema antes de empezar." };
    if (selected.size < limits.min)
      return {
        ok: false,
        reason: `Elige al menos ${limits.min} ${limits.min === 1 ? "materia" : "materias"}.`,
      };
    if (methodKey === "roleplay" && !persona.trim())
      return { ok: false, reason: "El roleplay necesita un personaje." };
    if (
      onlyTopic &&
      selectedNoteIds.size === 0 &&
      false /* "Usar toda la materia" is the default-allowed state */
    )
      return { ok: false };
    return { ok: true };
  }

  async function onStart() {
    const validity = canStart();
    if (!validity.ok) {
      if (validity.reason) toast.error(validity.reason);
      return;
    }
    setBusy(true);
    try {
      if (methodKey === "test") {
        const res = await fetch("/api/tests/generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            topic_ids: Array.from(selected),
            test_type: testType,
            question_count: questionCount,
          }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Error generando prueba");
        router.push(`/tests/${body.session_id}/take`);
        return;
      }

      const noteIds =
        selected.size === 1 && selectedNoteIds.size > 0
          ? Array.from(selectedNoteIds)
          : undefined;
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          engine: methodKey,
          topic_ids: Array.from(selected),
          selected_note_ids: noteIds,
          persona: persona.trim() || undefined,
          scenario: scenario.trim() || undefined,
          objective,
          intensity,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Error");
      router.push(`/sessions/${body.session.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
      setBusy(false);
    }
  }

  const validity = canStart();

  return (
    <div className="p-5 md:p-10 max-w-7xl mx-auto">
      <Link
        href="/topics"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
        Volver
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 lg:gap-8 items-start">
        <div className="flex flex-col gap-6">
          <NewSessionHero methodKey={methodKey} />

          <Step
            index={1}
            total={stepCount}
            title="Elige cómo entrenar"
            kicker="Método"
            theme={theme}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ALL_METHOD_KEYS.map((opt) => (
                <MethodPickCard
                  key={opt}
                  methodKey={opt}
                  isActive={opt === methodKey}
                  onClick={() => changeMethod(opt)}
                />
              ))}
            </div>
          </Step>

          <Step
            index={2}
            total={stepCount}
            title={
              limits.max === 1
                ? "Elige tu materia"
                : `Elige tu materia (puedes combinar hasta ${limits.max})`
            }
            kicker="Materia"
            theme={theme}
            description={
              limits.min > 1
                ? `Este método necesita al menos ${limits.min} materias para que valga la pena.`
                : undefined
            }
          >
            <TopicSelector
              topics={topics}
              loading={loading}
              selected={selected}
              theme={theme}
              limits={limits}
              onToggle={toggleTopic}
            />
          </Step>

          {onlyTopic && (
            <Step
              index={3}
              total={stepCount}
              title="¿Toda la materia o solo una parte?"
              kicker="Material"
              theme={theme}
              description="Aplica solo cuando hay una materia seleccionada. Ideal para enfocarte en una unidad o apunte concreto."
            >
              <TopicMaterialPicker
                topic={onlyTopic}
                engine={themeEngine}
                selected={selectedNoteIds}
                onChange={setSelectedNoteIds}
              />
            </Step>
          )}

          {selected.size > 1 && (
            <Step
              index={3}
              total={stepCount}
              title="Material por materia"
              kicker="Material"
              theme={theme}
            >
              <div className="rounded-2xl border border-black/[0.06] bg-white/55 px-4 py-3 text-[12.5px] text-muted-foreground leading-relaxed">
                Con varias materias seleccionadas, la sesión usa todo el
                material de cada una. Para acotar a un apunte concreto, deja un
                solo tema en el bloque anterior.
              </div>
            </Step>
          )}

          <Step
            index={onlyTopic || selected.size > 1 ? 4 : 3}
            total={stepCount}
            title="Cómo quieres que sea la sesión"
            kicker="Ajustes"
            theme={theme}
          >
            {methodKey === "test" ? (
              <TestSettings
                testType={testType}
                onChangeType={setTestType}
                questionCount={questionCount}
                onChangeCount={setQuestionCount}
                accent={theme.accent}
              />
            ) : (
              <ChatSettings
                methodKey={methodKey}
                objective={objective}
                onChangeObjective={setObjectiveAndAdjust}
                intensity={intensity}
                onChangeIntensity={setIntensity}
                persona={persona}
                onChangePersona={setPersona}
                scenario={scenario}
                onChangeScenario={setScenario}
                accent={theme.accent}
              />
            )}
          </Step>
        </div>

        <div className="lg:sticky lg:top-6">
          <SummaryPanel
            methodKey={methodKey}
            theme={theme}
            personality={personality}
            topics={selectedTopics}
            allTopicsCount={topics.length}
            onlyTopic={onlyTopic}
            selectedNoteIds={selectedNoteIds}
            objective={objective}
            intensity={intensity}
            persona={persona}
            testType={testType}
            questionCount={questionCount}
            disabled={!validity.ok || busy}
            disabledReason={validity.reason}
            busy={busy}
            onStart={onStart}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Building blocks
// ─────────────────────────────────────────────────────────────────

function Step({
  index,
  total,
  title,
  kicker,
  theme,
  description,
  children,
}: {
  index: number;
  total: number;
  title: string;
  kicker: string;
  theme: EngineTheme;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="font-mono text-[10px] uppercase tracking-[0.22em] inline-flex items-center justify-center px-2 py-0.5 rounded-full text-white"
            style={{ background: theme.accent }}
          >
            {String(index).padStart(2, "0")} · {kicker}
          </span>
          <h2 className="text-[15px] md:text-[16px] font-semibold tracking-tight text-foreground leading-tight">
            {title}
          </h2>
        </div>
        <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">
          paso {index} de {total}
        </span>
      </header>
      {description && (
        <p className="text-[12.5px] text-muted-foreground -mt-1 leading-relaxed">
          {description}
        </p>
      )}
      {children}
    </section>
  );
}

function NewSessionHero({ methodKey }: { methodKey: MethodKey }) {
  const themeEngine = methodKeyToThemeEngine(methodKey);
  const theme = getEngineTheme(themeEngine);
  const personality = getMethodPersonality(themeEngine);
  const Icon = theme.Icon;

  const heroStyle = {
    "--engine-accent": theme.accent,
    "--engine-accent-soft": hexToRgba(theme.accent, 0.07),
    "--engine-stage-gradient": theme.stageGradient,
    "--engine-stage-glow": theme.stageGlow,
  } as CSSProperties;

  return (
    <header className="method-stage relative overflow-hidden" style={heroStyle}>
      <div className="relative z-[2] flex items-start gap-4">
        <span
          className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/85 border shadow-soft shrink-0"
          style={{
            borderColor: hexToRgba(theme.accent, 0.25),
            color: theme.accent,
          }}
        >
          <Icon className="w-5 h-5" strokeWidth={1.6} />
        </span>
        <div className="flex flex-col gap-1.5 min-w-0 max-w-xl">
          <span
            className="font-mono text-[10px] uppercase tracking-[0.22em]"
            style={{ color: theme.accent }}
          >
            Configurar sesión · {personality.hudKicker}
          </span>
          <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight text-foreground leading-tight">
            {getMethodLabel(methodKey)}
          </h1>
          <p className="text-muted-foreground leading-relaxed text-[13.5px]">
            {personality.introHook}
          </p>
        </div>
      </div>
    </header>
  );
}

function MethodPickCard({
  methodKey,
  isActive,
  onClick,
}: {
  methodKey: MethodKey;
  isActive: boolean;
  onClick: () => void;
}) {
  const themeEngine = methodKeyToThemeEngine(methodKey);
  const theme = getEngineTheme(themeEngine);
  const personality = getMethodPersonality(themeEngine);
  const Icon = theme.Icon;
  const limits = ENGINE_LIMITS[methodKey];
  const tags = METHOD_TAGS[methodKey];

  const cardStyle = {
    "--engine-accent": theme.accent,
    "--engine-accent-soft": hexToRgba(theme.accent, 0.07),
    "--engine-stage-gradient": theme.stageGradient,
    "--engine-stage-glow": theme.stageGlow,
  } as CSSProperties;

  return (
    <button
      type="button"
      onClick={onClick}
      data-active={isActive}
      className="method-pick-card text-left rounded-2xl border bg-white/65 hover:bg-white p-3 flex flex-col gap-3 overflow-hidden"
      style={{
        ...cardStyle,
        borderColor: isActive
          ? hexToRgba(theme.accent, 0.5)
          : "rgba(0,0,0,0.07)",
        boxShadow: isActive
          ? `0 12px 32px ${hexToRgba(theme.accent, 0.22)}`
          : "0 1px 4px rgba(0,0,0,0.03)",
      }}
    >
      <div className="method-pick-preview">
        <PickPreviewMotif methodKey={methodKey} />
        <span
          className="absolute top-2.5 left-2.5 inline-flex items-center justify-center w-8 h-8 rounded-xl bg-white/85 border z-10"
          style={{
            borderColor: hexToRgba(theme.accent, 0.32),
            color: theme.accent,
          }}
        >
          <Icon className="w-4 h-4" strokeWidth={1.7} />
        </span>
        <span
          className="absolute top-3 right-3 font-mono text-[9px] uppercase tracking-[0.18em] z-10"
          style={{ color: theme.accent }}
        >
          {personality.hudKicker}
        </span>
        {isActive && (
          <span
            className="absolute bottom-2.5 right-2.5 font-mono text-[9px] uppercase tracking-[0.16em] inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-white z-10"
            style={{ background: theme.accent }}
          >
            elegido
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-[14px] text-foreground">
            {getMethodLabel(methodKey)}
          </span>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
            {limits.min === limits.max
              ? `${limits.min} ${limits.min === 1 ? "materia" : "materias"}`
              : `${limits.min}–${limits.max} materias`}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] tracking-[0.04em] px-2 py-0.5 rounded-full"
              style={{
                background: isActive
                  ? hexToRgba(theme.accent, 0.14)
                  : "rgba(0,0,0,0.04)",
                color: isActive ? theme.accent : "rgba(0,0,0,0.55)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

function PickPreviewMotif({ methodKey }: { methodKey: MethodKey }) {
  if (methodKey === "test") {
    return (
      <>
        <span className="method-scene-checkrow" style={{ top: "32%" }} aria-hidden />
        <span
          className="method-scene-checkrow"
          style={{ top: "54%", animationDelay: "-0.7s" }}
          aria-hidden
        />
        <span
          className="method-scene-checkrow"
          style={{ top: "76%", animationDelay: "-1.3s" }}
          aria-hidden
        />
      </>
    );
  }
  const persona = getMethodPersonality(methodKey as LearningEngine).intro;
  if (persona === "mentor") return <span className="method-scene-rings" aria-hidden />;
  if (persona === "detective") {
    return (
      <>
        <div className="method-scene-grid" aria-hidden />
        <div className="method-scene-scan" aria-hidden />
      </>
    );
  }
  if (persona === "rival") {
    return (
      <>
        <span className="method-scene-strike method-scene-strike--a" aria-hidden />
        <span
          className="method-scene-strike method-scene-strike--b"
          style={{ left: "calc(50% + 4px)" }}
          aria-hidden
        />
      </>
    );
  }
  if (persona === "cartographer") {
    return (
      <>
        <span className="method-scene-node" style={{ top: "30%", left: "62%" }} aria-hidden />
        <span
          className="method-scene-node"
          style={{ top: "60%", left: "78%", animationDelay: "-0.7s" }}
          aria-hidden
        />
        <span
          className="method-scene-node"
          style={{ top: "70%", left: "55%", animationDelay: "-1.4s" }}
          aria-hidden
        />
        <span
          className="method-scene-link"
          style={{
            top: "34%",
            left: "55%",
            width: "20%",
            transform: "rotate(28deg)",
          }}
          aria-hidden
        />
      </>
    );
  }
  if (persona === "director") return <div className="method-scene-spotlight" aria-hidden />;
  return null;
}

function TopicSelector({
  topics,
  loading,
  selected,
  theme,
  limits,
  onToggle,
}: {
  topics: SparkTopic[];
  loading: boolean;
  selected: Set<string>;
  theme: EngineTheme;
  limits: { min: number; max: number };
  onToggle: (id: string) => void;
}) {
  if (loading) {
    return <div className="text-sm text-muted-foreground">Cargando materias…</div>;
  }
  if (topics.length === 0) {
    return (
      <div className="flex flex-col gap-3 p-5 rounded-2xl border border-black/[0.07] bg-white/60">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <Layers className="w-4 h-4 text-spark" strokeWidth={1.75} />
          Aún no tienes materias guardadas.
        </div>
        <p className="text-[12px] text-muted-foreground">
          Crea o importa una materia antes de iniciar una sesión.
        </p>
        <Link
          href="/topics"
          className="self-start inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-white text-[12px] font-medium"
          style={{ background: theme.coachGradient }}
        >
          Crear o importar materia
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
        </Link>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto scrollbar-thin pr-1">
      {topics.map((t) => {
        const isSelected = selected.has(t.id);
        const disabled = !isSelected && selected.size >= limits.max;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onToggle(t.id)}
            disabled={disabled}
            className={cn(
              "text-left p-3 rounded-xl border transition-colors",
              isSelected
                ? "bg-white shadow-soft"
                : disabled
                  ? "border-black/[0.05] bg-white/40 opacity-50 cursor-not-allowed"
                  : "border-black/[0.07] bg-white/60 hover:bg-white",
            )}
            style={
              isSelected
                ? { borderColor: hexToRgba(theme.accent, 0.45) }
                : undefined
            }
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex flex-col">
                {t.category && (
                  <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-0.5">
                    {t.category}
                  </span>
                )}
                <span className="font-medium text-sm text-foreground">
                  {t.title}
                </span>
              </div>
              {isSelected && (
                <span
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full shrink-0 text-white"
                  style={{ background: theme.accent }}
                >
                  <CheckSquare className="w-3 h-3" strokeWidth={2.4} />
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Settings panels
// ─────────────────────────────────────────────────────────────────

function ChatSettings({
  methodKey,
  objective,
  onChangeObjective,
  intensity,
  onChangeIntensity,
  persona,
  onChangePersona,
  scenario,
  onChangeScenario,
  accent,
}: {
  methodKey: MethodKey;
  objective: SessionObjective;
  onChangeObjective: (next: SessionObjective) => void;
  intensity: SessionIntensity;
  onChangeIntensity: (next: SessionIntensity) => void;
  persona: string;
  onChangePersona: (next: string) => void;
  scenario: string;
  onChangeScenario: (next: string) => void;
  accent: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <OptionGroup
        label="Objetivo"
        description="Cómo quieres salir de esta sesión."
        options={OBJECTIVES}
        value={objective}
        onChange={onChangeObjective}
        accent={accent}
      />
      <OptionGroup
        label="Intensidad"
        description="Cuánta presión quieres que ponga Nova."
        options={INTENSITIES}
        value={intensity}
        onChange={onChangeIntensity}
        accent={accent}
      />

      {methodKey === "roleplay" && (
        <div className="flex flex-col gap-4 p-4 rounded-2xl border border-black/[0.06] bg-white/55">
          <div className="flex flex-col gap-2">
            <Label htmlFor="persona" className="text-[13px]">
              Personaje que adoptará Nova
            </Label>
            <Input
              id="persona"
              placeholder="ej. Inversionista ángel escéptico"
              value={persona}
              onChange={(e) => onChangePersona(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="scenario" className="text-[13px]">
              Escenario (opcional)
            </Label>
            <Textarea
              id="scenario"
              placeholder="Pitch de 5 minutos en demo day, sala llena…"
              value={scenario}
              onChange={(e) => onChangeScenario(e.target.value)}
              rows={3}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function TestSettings({
  testType,
  onChangeType,
  questionCount,
  onChangeCount,
  accent,
}: {
  testType: TestType;
  onChangeType: (next: TestType) => void;
  questionCount: number;
  onChangeCount: (next: number) => void;
  accent: string;
}) {
  const max = testType === "alternativas" ? 25 : 10;
  const safeCount = Math.min(Math.max(1, questionCount), max);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="text-[13px]">Formato</Label>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            elige uno
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {TEST_TYPES.map(({ value, label, description, Icon }) => {
            const active = testType === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onChangeType(value)}
                className={cn(
                  "text-left rounded-xl border p-3 transition-colors flex flex-col gap-1.5",
                )}
                style={{
                  borderColor: active ? hexToRgba(accent, 0.45) : "rgba(0,0,0,0.07)",
                  background: active ? hexToRgba(accent, 0.08) : "rgba(255,255,255,0.55)",
                }}
              >
                <span className="flex items-center gap-2">
                  <Icon
                    className="w-4 h-4"
                    strokeWidth={1.6}
                    style={{ color: active ? accent : "rgba(0,0,0,0.55)" }}
                  />
                  <span
                    className={cn(
                      "text-[13px] font-medium",
                      active ? "text-foreground" : "text-foreground/80",
                    )}
                  >
                    {label}
                  </span>
                </span>
                <span className="text-[11.5px] text-muted-foreground leading-relaxed">
                  {description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2 p-4 rounded-2xl border border-black/[0.06] bg-white/55">
        <div className="flex items-center justify-between">
          <Label htmlFor="count" className="text-[13px]">
            Cantidad de preguntas
          </Label>
          <span className="text-2xl font-semibold text-foreground tabular-nums w-10 text-right">
            {safeCount}
          </span>
        </div>
        <input
          id="count"
          type="range"
          min={1}
          max={max}
          value={safeCount}
          onChange={(e) => onChangeCount(Number(e.target.value))}
          className="w-full cursor-pointer h-1.5"
          style={{ accentColor: accent }}
        />
        <div className="flex justify-between text-[10px] text-muted-foreground/60 mt-1 font-mono">
          <span>1</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  );
}

function OptionGroup<T extends string>({
  label,
  description,
  options,
  value,
  onChange,
  accent,
}: {
  label: string;
  description: string;
  options: OptionDef<T>[];
  value: T;
  onChange: (next: T) => void;
  accent: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <Label className="text-[13px]">{label}</Label>
        <span className="text-[11px] text-muted-foreground">{description}</span>
      </div>
      <div
        className={cn(
          "grid gap-2",
          options.length === 4
            ? "grid-cols-2 lg:grid-cols-4"
            : "grid-cols-3",
        )}
      >
        {options.map((opt) => {
          const active = value === opt.value;
          const Icon = opt.Icon;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className="text-left rounded-xl border px-3 py-2.5 transition-colors flex flex-col gap-1.5"
              style={{
                borderColor: active ? hexToRgba(accent, 0.45) : "rgba(0,0,0,0.07)",
                background: active ? hexToRgba(accent, 0.08) : "rgba(255,255,255,0.55)",
              }}
            >
              <span className="flex items-center gap-1.5">
                <Icon
                  className="w-3.5 h-3.5"
                  strokeWidth={1.7}
                  style={{ color: active ? accent : "rgba(0,0,0,0.55)" }}
                />
                <span
                  className={cn(
                    "text-[12.5px] font-medium",
                    active ? "text-foreground" : "text-foreground/80",
                  )}
                >
                  {opt.label}
                </span>
              </span>
              <span className="text-[10.5px] text-muted-foreground leading-snug">
                {opt.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Right summary panel
// ─────────────────────────────────────────────────────────────────

const OBJECTIVE_LABELS: Record<SessionObjective, string> = {
  comprender: "Comprender",
  memorizar: "Memorizar",
  practicar: "Practicar",
  preparar_prueba: "Preparar prueba",
};

const INTENSITY_LABELS: Record<SessionIntensity, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
};

function SummaryPanel({
  methodKey,
  theme,
  personality,
  topics,
  allTopicsCount,
  onlyTopic,
  selectedNoteIds,
  objective,
  intensity,
  persona,
  testType,
  questionCount,
  disabled,
  disabledReason,
  busy,
  onStart,
}: {
  methodKey: MethodKey;
  theme: EngineTheme;
  personality: ReturnType<typeof getMethodPersonality>;
  topics: SparkTopic[];
  allTopicsCount: number;
  onlyTopic: SparkTopic | null;
  selectedNoteIds: Set<string>;
  objective: SessionObjective;
  intensity: SessionIntensity;
  persona: string;
  testType: TestType;
  questionCount: number;
  disabled: boolean;
  disabledReason?: string;
  busy: boolean;
  onStart: () => void;
}) {
  const Icon = theme.Icon;
  const isTest = methodKey === "test";

  const materialLabel = onlyTopic
    ? selectedNoteIds.size === 0
      ? "Toda la materia"
      : `${selectedNoteIds.size} ${selectedNoteIds.size === 1 ? "apunte" : "apuntes"}`
    : topics.length > 1
      ? `${topics.length} materias completas`
      : "—";

  const ctaLabel = isTest ? "Generar prueba" : "Iniciar con Nova";

  const novaHint = buildNovaHint(methodKey, objective, intensity, testType, questionCount);

  const panelStyle = {
    "--engine-accent": theme.accent,
    background: `linear-gradient(160deg, ${hexToRgba(theme.accent, 0.06)} 0%, rgba(255,255,255,0.92) 70%)`,
    borderColor: hexToRgba(theme.accent, 0.18),
  } as CSSProperties;

  return (
    <aside
      className="rounded-3xl border p-5 flex flex-col gap-4 shadow-soft"
      style={panelStyle}
    >
      <header className="flex items-start gap-3">
        <span
          className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-white border shrink-0"
          style={{ borderColor: hexToRgba(theme.accent, 0.3), color: theme.accent }}
        >
          <Icon className="w-4.5 h-4.5" strokeWidth={1.7} />
        </span>
        <div className="flex flex-col min-w-0">
          <span
            className="font-mono text-[10px] uppercase tracking-[0.22em]"
            style={{ color: theme.accent }}
          >
            Tu sesión
          </span>
          <h3 className="text-[16px] font-semibold tracking-tight text-foreground">
            {getMethodLabel(methodKey)}
          </h3>
          <span className="text-[11.5px] text-muted-foreground">
            {personality.novaToneTag}
          </span>
        </div>
      </header>

      <ul className="flex flex-col gap-2.5 text-[12.5px]">
        <SummaryRow label="Método" value={getMethodLabel(methodKey)} accent={theme.accent} />
        <SummaryRow
          label="Materia"
          value={
            topics.length === 0
              ? <span className="text-muted-foreground italic">Aún sin elegir</span>
              : topics.length === 1
                ? topics[0].title
                : `${topics.length} materias`
          }
          accent={theme.accent}
        />
        <SummaryRow label="Material" value={materialLabel} accent={theme.accent} />
        {isTest ? (
          <>
            <SummaryRow
              label="Formato"
              value={testType === "alternativas" ? "Alternativas" : "Desarrollo"}
              accent={theme.accent}
            />
            <SummaryRow
              label="Preguntas"
              value={`${questionCount}`}
              accent={theme.accent}
            />
          </>
        ) : (
          <>
            <SummaryRow
              label="Objetivo"
              value={OBJECTIVE_LABELS[objective]}
              accent={theme.accent}
            />
            <SummaryRow
              label="Intensidad"
              value={INTENSITY_LABELS[intensity]}
              accent={theme.accent}
            />
            {methodKey === "roleplay" && (
              <SummaryRow
                label="Personaje"
                value={
                  persona.trim() ? (
                    persona
                  ) : (
                    <span className="text-muted-foreground italic">Sin definir</span>
                  )
                }
                accent={theme.accent}
              />
            )}
          </>
        )}
      </ul>

      <div className="rounded-2xl bg-white/85 border border-black/[0.05] p-3 text-[12px] leading-relaxed text-foreground/85">
        <span
          className="block font-mono text-[10px] uppercase tracking-[0.18em] mb-1"
          style={{ color: theme.accent }}
        >
          Nova lo hará así
        </span>
        {novaHint}
      </div>

      <button
        type="button"
        onClick={onStart}
        disabled={disabled}
        className="rounded-full text-white font-medium text-[14px] px-4 py-3 transition-opacity flex items-center justify-center gap-2"
        style={{
          background: theme.coachGradient,
          boxShadow: `0 10px 26px ${hexToRgba(theme.accent, 0.32)}`,
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {busy ? "Preparando…" : ctaLabel}
        <ArrowRight className="w-4 h-4" strokeWidth={1.8} />
      </button>

      {disabled && disabledReason && (
        <p className="text-[11.5px] text-muted-foreground text-center -mt-1">
          {disabledReason}
        </p>
      )}

      {!disabled && allTopicsCount === 0 && (
        <Badge className="self-center text-[10px]">Faltan materias</Badge>
      )}
    </aside>
  );
}

function SummaryRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: ReactNode;
  accent: string;
}) {
  return (
    <li className="flex items-start justify-between gap-3">
      <span
        className="font-mono text-[10px] uppercase tracking-[0.18em] shrink-0 mt-0.5"
        style={{ color: hexToRgba(accent, 0.85) }}
      >
        {label}
      </span>
      <span className="text-[12.5px] font-medium text-foreground text-right truncate-2">
        {value}
      </span>
    </li>
  );
}

function buildNovaHint(
  methodKey: MethodKey,
  objective: SessionObjective,
  intensity: SessionIntensity,
  testType: TestType,
  questionCount: number,
): string {
  if (methodKey === "test") {
    const fmt = testType === "alternativas" ? "alternativas" : "preguntas de desarrollo";
    return `Voy a generar ${questionCount} ${fmt} basadas en tu material. Tú respondes y te entrego nota con feedback.`;
  }
  const objectiveHint: Record<SessionObjective, string> = {
    comprender: "Voy a empujarte a explicar el porqué con tus palabras.",
    memorizar: "Vamos a fijar lo esencial con repetición y flashcards al final.",
    practicar: "Te haré aplicar el concepto en casos concretos turn por turn.",
    preparar_prueba: "Modo evaluación: trabajaré al nivel que esperas en la prueba.",
  };
  const intensityHint: Record<SessionIntensity, string> = {
    baja: "Sin prisa: te doy más pistas y celebro los pasos correctos.",
    media: "Presión sostenida: avanzo a tu ritmo pero no te facilito el camino.",
    alta: "Modo combate: ataco lo flojo sin contemplaciones.",
  };
  return `${objectiveHint[objective]} ${intensityHint[intensity]}`;
}

function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function NewSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          <div className="h-8 w-40 rounded bg-white/[0.04] animate-pulse mb-4" />
          <div className="h-32 rounded bg-white/[0.04] animate-pulse" />
        </div>
      }
    >
      <NewSessionForm />
    </Suspense>
  );
}
