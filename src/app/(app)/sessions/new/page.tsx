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
  ArrowRight,
  Brain,
  Briefcase,
  ChevronLeft,
  ClipboardList,
  Flame,
  FlaskConical,
  Gauge,
  GraduationCap,
  Layers,
  PencilLine,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  Wand2,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ENGINE_LABELS, ENGINE_TAGS } from "@/modules/spark/engines";
import { getEngineTheme, type EngineTheme } from "@/modules/spark/engines/themes";
import { getMethodPersonality } from "@/modules/spark/engines/personalities";
import { TopicMaterialPicker } from "@/components/topics/TopicMaterialPicker";
import { cn } from "@/lib/utils/cn";
import {
  getInitialSelectedTopicIds,
  getNewSessionStepCount,
} from "@/lib/spark/new-session-query";
import type {
  LearningEngine,
  SessionIntensity,
  SessionObjective,
  SparkTopic,
} from "@/modules/spark/types";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────
// Method picker model
// ─────────────────────────────────────────────────────────────────
// 5 métodos chat. La generación de pruebas vive aparte en /tests/new
// para evitar duplicar el flujo y confundir al estudiante.

type MethodKey =
  | "socratic"
  | "debugger"
  | "devils_advocate"
  | "bridge_builder"
  | "roleplay";

const ALL_METHOD_KEYS: MethodKey[] = [
  "socratic",
  "debugger",
  "devils_advocate",
  "bridge_builder",
  "roleplay",
];

const ENGINE_LIMITS: Record<MethodKey, { min: number; max: number }> = {
  debugger: { min: 1, max: 2 },
  devils_advocate: { min: 1, max: 1 },
  roleplay: { min: 1, max: 3 },
  bridge_builder: { min: 2, max: 6 },
  socratic: { min: 1, max: 2 },
};

function methodKeyToThemeEngine(key: MethodKey): LearningEngine {
  return key as LearningEngine;
}

const METHOD_TAGS: Record<MethodKey, string[]> = {
  socratic: ENGINE_TAGS[methodKeyToThemeEngine("socratic")],
  debugger: ENGINE_TAGS[methodKeyToThemeEngine("debugger")],
  devils_advocate: ENGINE_TAGS[methodKeyToThemeEngine("devils_advocate")],
  bridge_builder: ENGINE_TAGS[methodKeyToThemeEngine("bridge_builder")],
  roleplay: ENGINE_TAGS[methodKeyToThemeEngine("roleplay")],
};

function getMethodLabel(key: MethodKey): string {
  return ENGINE_LABELS[key as LearningEngine];
}

// ─────────────────────────────────────────────────────────────────
// Roleplay scenarios (curated)
// ─────────────────────────────────────────────────────────────────
// El estudiante no debería tener que inventar el rol del personaje.
// 6 escenarios pre-configurados + opción de personalizar. Cada uno
// tiene persona y scenario por defecto que la sesión consume tal cual.

interface RoleplayScenario {
  id: string;
  label: string;
  description: string;
  Icon: LucideIcon;
  persona: string;
  scenario: string;
}

const ROLEPLAY_SCENARIOS: RoleplayScenario[] = [
  {
    id: "skeptical_client",
    label: "Cliente escéptico",
    description: "Pide pruebas concretas antes de comprar.",
    Icon: Briefcase,
    persona:
      "Cliente potencial escéptico. No le interesa el marketing, busca pruebas concretas y casos reales antes de decidir.",
    scenario:
      "Reunión de venta de 10 minutos. Tú aplicas el tema para venderle algo concreto, él busca razones para decir que no.",
  },
  {
    id: "demanding_professor",
    label: "Profesor exigente",
    description: "Examen oral con rigor académico.",
    Icon: GraduationCap,
    persona:
      "Profesor universitario exigente. Si la respuesta no es precisa, repregunta hasta encontrar el vacío. Penaliza la jerga vacía.",
    scenario:
      "Examen oral sobre el tema. Te pregunta y exige rigor académico. Si dudas o repites sin entender, baja la nota.",
  },
  {
    id: "investor",
    label: "Inversionista frío",
    description: "Solo le importan métricas y mercado.",
    Icon: TrendingUp,
    persona:
      "Inversionista early-stage frío. No le interesan las emociones; solo unit economics, mercado y diferenciación.",
    scenario:
      "Pitch de 5 minutos en demo day. Tú vendes la idea aplicando el tema, él busca grietas en tu lógica de mercado.",
  },
  {
    id: "junior_colleague",
    label: "Compañero junior",
    description: "Necesita entender desde cero, sin jerga.",
    Icon: UserCheck,
    persona:
      "Colega junior que necesita entender el tema desde cero. Pregunta lo obvio, y si usas jerga te pide que lo expliques de otra forma.",
    scenario:
      "Te pidieron explicarle el tema en 10 minutos para que pueda contribuir mañana. Sin diapositivas, solo conversación.",
  },
  {
    id: "manager",
    label: "Manager pidiendo justificación",
    description: "Necesita justificar tu decisión a un comité.",
    Icon: ShieldCheck,
    persona:
      "Manager directo. Necesita justificar tu propuesta ante un comité y te pide que cubras los flancos antes de exponerla.",
    scenario:
      "Reunión 1:1 de 15 minutos. Te pregunta por qué tu approach es el correcto, qué riesgos tiene y cómo responderías a las objeciones obvias.",
  },
  {
    id: "interviewer",
    label: "Entrevistador técnico",
    description: "Entrevista con preguntas trampa.",
    Icon: ClipboardList,
    persona:
      "Entrevistador técnico de una empresa exigente. Hace preguntas trampa para distinguir entre quien memorizó y quien entiende.",
    scenario:
      "Entrevista técnica de 30 minutos para tu rol soñado. Pregunta sobre el tema y profundiza cuando ve dudas.",
  },
  {
    id: "custom",
    label: "Personalizar",
    description: "Tú escribes el personaje y la situación.",
    Icon: PencilLine,
    persona: "",
    scenario: "",
  },
];

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

// ─────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────

function NewSessionForm() {
  const router = useRouter();
  const params = useSearchParams();

  const requestedEngine = params.get("engine") as LearningEngine | null;
  // Si llegan con engine= en la URL (vinieron desde dashboard/topic), pre-seleccionamos
  // ese método pero mantenemos el selector visible (el usuario puede cambiar de idea).
  const initialMethod: MethodKey =
    requestedEngine &&
    requestedEngine in ENGINE_LIMITS &&
    requestedEngine !== "test_alternativas" &&
    requestedEngine !== "test_desarrollo"
      ? (requestedEngine as MethodKey)
      : "socratic";
  const presetTopic = params.get("topic");
  const presetTopicIds = params.get("topic_ids");
  const initialSelectedTopicIds = getInitialSelectedTopicIds({
    topic: presetTopic,
    topicIds: presetTopicIds,
    max: ENGINE_LIMITS[initialMethod].max,
  });

  const [topics, setTopics] = useState<SparkTopic[]>([]);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initialSelectedTopicIds),
  );
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());
  const [methodKey, setMethodKey] = useState<MethodKey>(initialMethod);

  // ── Modo demo ──────────────────────────────────────────────────
  // Permite al usuario probar cualquier método sin tener temas reales.
  // Cuando activo, el selector solo muestra topics is_demo y se
  // pre-seleccionan automáticamente según los límites del método.
  const [demoMode, setDemoMode] = useState(false);
  const [demoSeeding, setDemoSeeding] = useState(false);

  // Roleplay state — escenario seleccionado de la lista curada
  const [scenarioId, setScenarioId] = useState<string>(ROLEPLAY_SCENARIOS[0].id);
  const [persona, setPersona] = useState(ROLEPLAY_SCENARIOS[0].persona);
  const [scenario, setScenario] = useState(ROLEPLAY_SCENARIOS[0].scenario);

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

  const realTopics = useMemo(
    () => topics.filter((t) => !t.is_demo),
    [topics],
  );
  const demoTopics = useMemo(
    () => topics.filter((t) => t.is_demo),
    [topics],
  );

  /**
   * Topics visibles en el selector según el modo. En modo demo solo
   * mostramos los topics is_demo (creándolos si hace falta vía el POST
   * de activación). Fuera de modo demo, mostramos los reales — y solo
   * caemos a los demo si el usuario no tiene ningún tema real (mejor
   * que un selector vacío).
   */
  const visibleTopics = useMemo(() => {
    if (demoMode) return demoTopics;
    return realTopics.length > 0 ? realTopics : demoTopics;
  }, [demoMode, realTopics, demoTopics]);

  async function activateDemoMode() {
    if (demoSeeding) return;
    setDemoSeeding(true);
    try {
      const res = await fetch("/api/topics/demo", { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "No se pudo cargar material demo");
      const ids: string[] = body.topicIds ?? [];

      // Refresca el listado para incluir los topics demo recién creados.
      const fresh = await fetch("/api/topics").then((r) => r.json());
      const freshTopics: SparkTopic[] = fresh.topics ?? [];
      setTopics(freshTopics);

      // Pre-selecciona según el método: bridge_builder necesita 2,
      // los demás 1. Si quedan más demos disponibles, igual el toggle
      // del usuario sigue funcionando.
      const limits = ENGINE_LIMITS[methodKey];
      const sliced = ids.slice(0, Math.max(limits.min, 1));
      setSelected(new Set(sliced));
      setSelectedNoteIds(new Set());

      // Auto-completa persona en roleplay para que el usuario pueda
      // arrancar sin trabarse en el campo obligatorio.
      if (methodKey === "roleplay" && !persona.trim()) {
        setPersona("Cliente potencial escéptico que pregunta por qué debería confiar en una marca digital.");
      }

      setDemoMode(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setDemoSeeding(false);
    }
  }

  function deactivateDemoMode() {
    setDemoMode(false);
    setSelected(new Set());
    setSelectedNoteIds(new Set());
  }

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

  const stepCount = getNewSessionStepCount(selected.size);

  function canStart(): { ok: boolean; reason?: string } {
    if (loading) return { ok: false, reason: "Cargando temas…" };
    if (visibleTopics.length === 0)
      return {
        ok: false,
        reason: "Activa el material de ejemplo o crea un tema.",
      };
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
            <DemoModePanel
              demoMode={demoMode}
              demoSeeding={demoSeeding}
              hasRealTopics={realTopics.length > 0}
              onActivate={activateDemoMode}
              onDeactivate={deactivateDemoMode}
            />
            <TopicSelector
              topics={visibleTopics}
              loading={loading}
              selected={selected}
              theme={theme}
              limits={limits}
              onToggle={toggleTopic}
              demoMode={demoMode}
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
            <ChatSettings
              methodKey={methodKey}
              objective={objective}
              onChangeObjective={setObjectiveAndAdjust}
              intensity={intensity}
              onChangeIntensity={setIntensity}
              scenarioId={scenarioId}
              onChangeScenario={(id) => {
                setScenarioId(id);
                const scn = ROLEPLAY_SCENARIOS.find((s) => s.id === id);
                if (scn) {
                  setPersona(scn.persona);
                  setScenario(scn.scenario);
                }
              }}
              persona={persona}
              onChangePersona={setPersona}
              scenario={scenario}
              onChangeScenarioText={setScenario}
              accent={theme.accent}
            />
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
            className="text-[12px] font-medium inline-flex items-center justify-center px-2.5 py-1 rounded-full text-white"
            style={{ background: theme.accent }}
          >
            {kicker}
          </span>
          <h2 className="text-[16px] md:text-[17px] font-medium tracking-tight text-foreground leading-tight">
            {title}
          </h2>
        </div>
        <span className="text-[12px] text-muted-foreground">
          Paso {index} de {total}
        </span>
      </header>
      {description && (
        <p className="text-[13px] text-muted-foreground -mt-1 leading-relaxed">
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
          <Icon className="w-5 h-5" strokeWidth={1.5} />
        </span>
        <div className="flex flex-col gap-1.5 min-w-0 max-w-xl">
          <span
            className="text-[13px] font-medium"
            style={{ color: theme.accent }}
          >
            {personality.hudKicker}
          </span>
          <h1 className="text-2xl md:text-[28px] font-medium tracking-tight text-foreground leading-tight">
            {getMethodLabel(methodKey)}
          </h1>
          <p className="text-muted-foreground leading-relaxed text-[14px]">
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
          <Icon className="w-4 h-4" strokeWidth={1.5} />
        </span>
        <span
          className="absolute top-3 right-3 text-[11px] font-medium z-10"
          style={{ color: theme.accent }}
        >
          {personality.hudKicker}
        </span>
        {isActive && (
          <span
            className="absolute bottom-2.5 right-2.5 text-[11px] font-medium inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-white z-10"
            style={{ background: theme.accent }}
          >
            Elegido
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-[14px] text-foreground">
            {getMethodLabel(methodKey)}
          </span>
          <span className="text-[11px] text-muted-foreground">
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
  demoMode,
}: {
  topics: SparkTopic[];
  loading: boolean;
  selected: Set<string>;
  theme: EngineTheme;
  limits: { min: number; max: number };
  onToggle: (id: string) => void;
  demoMode?: boolean;
}) {
  if (loading) {
    return <div className="text-sm text-muted-foreground">Cargando materias…</div>;
  }
  if (topics.length === 0) {
    return (
      <div className="flex flex-col gap-3 p-5 rounded-2xl border border-black/[0.07] bg-white/60">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <Layers className="w-4 h-4 text-spark" strokeWidth={1.5} />
          Aún no tienes materias guardadas.
        </div>
        <p className="text-[12px] text-muted-foreground">
          Crea o importa una materia, o activa el modo de ejemplo arriba para
          probar el método sin material propio.
        </p>
        <Link
          href="/topics"
          className="self-start inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-white text-[12px] font-medium"
          style={{ background: theme.coachGradient }}
        >
          Crear o importar materia
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
        </Link>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto scrollbar-thin pr-1">
      {topics.map((t) => {
        const isSelected = selected.has(t.id);
        const disabled = !isSelected && selected.size >= limits.max;
        const showDemoBadge = !!t.is_demo && !demoMode;
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
                <span className="font-medium text-sm text-foreground inline-flex items-center gap-2">
                  {t.title}
                  {showDemoBadge && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-spark/20 bg-spark/[0.08] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-spark">
                      Demo
                    </span>
                  )}
                </span>
              </div>
              {isSelected && (
                <span
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full shrink-0 text-white text-[11px] font-semibold"
                  style={{ background: theme.accent }}
                >
                  ✓
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Banner que invita al usuario a probar el método con material de ejemplo
 * pre-seedeado. Útil cuando no tiene contenido real, o cuando quiere
 * explorar un método sin contaminar sus materias reales con sesiones de
 * prueba.
 */
function DemoModePanel({
  demoMode,
  demoSeeding,
  hasRealTopics,
  onActivate,
  onDeactivate,
}: {
  demoMode: boolean;
  demoSeeding: boolean;
  hasRealTopics: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  if (demoMode) {
    return (
      <div className="mb-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between rounded-xl border border-spark/25 bg-spark/[0.06] px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-spark/15 text-spark shrink-0">
            <FlaskConical className="w-3.5 h-3.5" strokeWidth={1.5} />
          </span>
          <div className="min-w-0">
            <div className="text-[12.5px] font-semibold text-foreground">
              Material de ejemplo activo
            </div>
            <p className="text-[11.5px] text-muted-foreground leading-snug">
              Usando dos materias demo. Tus datos reales no se mezclan.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDeactivate}
          className="text-[11.5px] font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          Volver a mis materias
        </button>
      </div>
    );
  }
  return (
    <div className="mb-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between rounded-xl border border-dashed border-spark/30 bg-spark/[0.03] px-4 py-3">
      <div className="flex items-start gap-2.5 min-w-0">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white/80 border border-spark/20 text-spark shrink-0">
          <FlaskConical className="w-3.5 h-3.5" strokeWidth={1.5} />
        </span>
        <div className="min-w-0">
          <div className="text-[12.5px] font-semibold text-foreground">
            {hasRealTopics
              ? "¿Quieres probar este método sin tu material?"
              : "¿No tienes material todavía?"}
          </div>
          <p className="text-[11.5px] text-muted-foreground leading-snug">
            Carga dos materias de ejemplo (Marketing) para probar cualquier
            método al instante.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onActivate}
        disabled={demoSeeding}
        className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-spark px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {demoSeeding ? "Cargando…" : "Probar con ejemplo"}
        {!demoSeeding && <ArrowRight className="w-3 h-3" strokeWidth={1.5} />}
      </button>
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
  scenarioId,
  onChangeScenario,
  persona,
  onChangePersona,
  scenario,
  onChangeScenarioText,
  accent,
}: {
  methodKey: MethodKey;
  objective: SessionObjective;
  onChangeObjective: (next: SessionObjective) => void;
  intensity: SessionIntensity;
  onChangeIntensity: (next: SessionIntensity) => void;
  scenarioId: string;
  onChangeScenario: (id: string) => void;
  persona: string;
  onChangePersona: (next: string) => void;
  scenario: string;
  onChangeScenarioText: (next: string) => void;
  accent: string;
}) {
  const isCustom = scenarioId === "custom";
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
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <Label className="text-[13px]">Escenario</Label>
            <span className="text-[11px] text-muted-foreground">
              Elige una situación o personaliza la tuya.
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ROLEPLAY_SCENARIOS.map((scn) => {
              const active = scenarioId === scn.id;
              const Icon = scn.Icon;
              return (
                <button
                  key={scn.id}
                  type="button"
                  onClick={() => onChangeScenario(scn.id)}
                  className="text-left rounded-xl border p-3 transition-colors flex items-start gap-2.5"
                  style={{
                    borderColor: active ? hexToRgba(accent, 0.5) : "rgba(0,0,0,0.07)",
                    background: active ? hexToRgba(accent, 0.07) : "rgba(255,255,255,0.55)",
                  }}
                >
                  <span
                    className="inline-flex items-center justify-center w-7 h-7 rounded-md shrink-0 mt-0.5"
                    style={{
                      background: active ? hexToRgba(accent, 0.16) : "rgba(0,0,0,0.04)",
                      color: active ? accent : "rgba(0,0,0,0.55)",
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </span>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span
                      className={cn(
                        "text-[13px] font-medium",
                        active ? "text-foreground" : "text-foreground/85",
                      )}
                    >
                      {scn.label}
                    </span>
                    <span className="text-[11.5px] text-muted-foreground leading-snug">
                      {scn.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {!isCustom && (
            <div className="rounded-xl border border-black/[0.06] bg-white/65 p-3.5 flex flex-col gap-1.5">
              <span className="text-[11px] text-muted-foreground">Nova será</span>
              <p className="text-[13px] text-foreground/85 leading-relaxed">
                {persona}
              </p>
              <span className="text-[11px] text-muted-foreground mt-2">Situación</span>
              <p className="text-[13px] text-foreground/85 leading-relaxed">
                {scenario}
              </p>
            </div>
          )}

          {isCustom && (
            <div className="flex flex-col gap-3 p-4 rounded-xl border border-black/[0.06] bg-white/55">
              <div className="flex flex-col gap-2">
                <Label htmlFor="persona" className="text-[13px]">
                  Personaje que adoptará Nova
                </Label>
                <Textarea
                  id="persona"
                  placeholder="ej. Inversionista ángel escéptico que pide métricas concretas."
                  value={persona}
                  onChange={(e) => onChangePersona(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="scenario" className="text-[13px]">
                  Situación
                </Label>
                <Textarea
                  id="scenario"
                  placeholder="Pitch de 5 minutos en demo day, sala llena…"
                  value={scenario}
                  onChange={(e) => onChangeScenarioText(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>
      )}
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
                  strokeWidth={1.5}
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
  disabled: boolean;
  disabledReason?: string;
  busy: boolean;
  onStart: () => void;
}) {
  const Icon = theme.Icon;

  const materialLabel = onlyTopic
    ? selectedNoteIds.size === 0
      ? "Toda la materia"
      : `${selectedNoteIds.size} ${selectedNoteIds.size === 1 ? "apunte" : "apuntes"}`
    : topics.length > 1
      ? `${topics.length} materias completas`
      : "—";

  const ctaLabel = "Iniciar con Nova";

  const novaHint = buildNovaHint(methodKey, objective, intensity);

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
          <Icon className="w-4.5 h-4.5" strokeWidth={1.5} />
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
        <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
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
  _methodKey: MethodKey,
  objective: SessionObjective,
  intensity: SessionIntensity,
): string {
  const objectiveHint: Record<SessionObjective, string> = {
    comprender: "Voy a empujarte a explicar el porqué con tus palabras.",
    memorizar: "Vamos a fijar lo esencial con repetición y flashcards al final.",
    practicar: "Te haré aplicar el concepto en casos concretos turn por turn.",
    preparar_prueba: "Modo evaluación: trabajaré al nivel que esperas en la prueba.",
  };
  const intensityHint: Record<SessionIntensity, string> = {
    baja: "Sin prisa: te doy más pistas y celebro los pasos correctos.",
    media: "Presión sostenida: avanzo a tu ritmo pero no te facilito el camino.",
    alta: "Exigencia alta: identifico vacíos rápido y subo el rigor.",
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
