"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { ActiveProject, PersonalGoal, LearningStyle } from "@/modules/spark/types";

const STYLE_OPTIONS: { value: LearningStyle; label: string; hint: string }[] = [
  { value: "visual", label: "Visual", hint: "Diagramas, mapas, esquemas" },
  { value: "auditory", label: "Auditivo", hint: "Escuchar y discutir" },
  { value: "reading_writing", label: "Lectura/Escritura", hint: "Texto y notas" },
  { value: "kinesthetic", label: "Kinestésico", hint: "Hacer, practicar" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [career, setCareer] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [learningStyle, setLearningStyle] = useState<LearningStyle | "">("");
  const [projects, setProjects] = useState<ActiveProject[]>([]);
  const [goals, setGoals] = useState<PersonalGoal[]>([]);
  const [customContext, setCustomContext] = useState("");

  function addProject() {
    setProjects((p) => [...p, { name: "", type: "", deadline: "" }]);
  }
  function updateProject(i: number, patch: Partial<ActiveProject>) {
    setProjects((p) => p.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }
  function removeProject(i: number) {
    setProjects((p) => p.filter((_, idx) => idx !== i));
  }
  function addGoal() {
    setGoals((g) => [...g, { goal: "", category: "" }]);
  }
  function updateGoal(i: number, patch: Partial<PersonalGoal>) {
    setGoals((g) => g.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }
  function removeGoal(i: number) {
    setGoals((g) => g.filter((_, idx) => idx !== i));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!career.trim()) {
      toast.error("Cuéntame al menos tu carrera o rol.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/user-context", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          career: career.trim(),
          user_role: currentRole.trim() || null,
          learning_style: learningStyle || null,
          active_projects: projects.filter((p) => p.name.trim()),
          personal_goals: goals.filter((g) => g.goal.trim()),
          custom_context: customContext.trim() || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error");
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error guardando");
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-16 max-w-2xl mx-auto">
      <div className="flex flex-col gap-3 mb-10">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-spark">
          Spark · Bienvenida
        </span>
        <h1 className="text-4xl font-semibold tracking-tight leading-tight">
          Antes de empezar, <span className="italic text-nova-mid">cuéntame quién eres.</span>
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          Spark adapta cada sesión a tu contexto real. Esta es información que Nova
          tendrá presente sin que la repitas en cada sesión.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <Label htmlFor="career">Carrera o rol principal</Label>
          <Input
            id="career"
            required
            placeholder="ej. Ingeniería de software, Diseño de modas, Founder…"
            value={career}
            onChange={(e) => setCareer(e.target.value)}
          />
        </section>

        <section className="flex flex-col gap-3">
          <Label htmlFor="role">Rol actual</Label>
          <Input
            id="role"
            placeholder="ej. Estudiante 4to año, Founder, Senior dev"
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value)}
          />
        </section>

        <section className="flex flex-col gap-3">
          <Label>Estilo de aprendizaje</Label>
          <div className="grid grid-cols-2 gap-3">
            {STYLE_OPTIONS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setLearningStyle(s.value)}
                className={`text-left p-4 rounded-lg border transition-colors ${
                  learningStyle === s.value
                    ? "border-spark/50 bg-spark/5"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                }`}
              >
                <div className="font-medium text-sm">{s.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.hint}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label>Proyectos activos</Label>
            <button
              type="button"
              onClick={addProject}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Agregar
            </button>
          </div>
          {projects.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Sin proyectos por ahora. Puedes agregarlos después.
            </p>
          )}
          {projects.map((p, i) => (
            <div key={i} className="flex flex-col gap-2 p-3 rounded-md border border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Nombre"
                  value={p.name}
                  onChange={(e) => updateProject(i, { name: e.target.value })}
                />
                <button type="button" onClick={() => removeProject(i)} className="text-muted-foreground hover:text-destructive">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Tipo (tesis, side project…)"
                  value={p.type}
                  onChange={(e) => updateProject(i, { type: e.target.value })}
                />
                <Input
                  type="date"
                  placeholder="Deadline"
                  value={p.deadline ?? ""}
                  onChange={(e) => updateProject(i, { deadline: e.target.value })}
                />
              </div>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label>Metas personales</Label>
            <button
              type="button"
              onClick={addGoal}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Agregar
            </button>
          </div>
          {goals.map((g, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                placeholder="Meta"
                value={g.goal}
                onChange={(e) => updateGoal(i, { goal: e.target.value })}
              />
              <Input
                placeholder="Categoría"
                value={g.category}
                onChange={(e) => updateGoal(i, { category: e.target.value })}
              />
              <button type="button" onClick={() => removeGoal(i)} className="text-muted-foreground hover:text-destructive">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-3">
          <Label htmlFor="custom">Contexto adicional</Label>
          <Textarea
            id="custom"
            placeholder="Cualquier cosa que Nova deba saber sobre tu situación actual…"
            value={customContext}
            onChange={(e) => setCustomContext(e.target.value)}
            rows={4}
          />
        </section>

        <Button type="submit" disabled={busy} size="lg" className="self-end">
          {busy ? "Guardando…" : "Empezar"}
          <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
        </Button>
      </form>
    </main>
  );
}
