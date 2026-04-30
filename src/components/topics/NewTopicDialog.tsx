"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, FileText, Check, BookOpen } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type ExtractedTopic = {
  title: string;
  summary: string;
  category: string;
  tags: string[];
};

type KairosSubject = {
  id: string;
  name: string;
  professor: string | null;
  emoji: string | null;
  color: string | null;
  term: string | null;
  session_count: number;
  session_ids: string[];
};

export function NewTopicDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"manual" | "extract" | "kairos">("manual");
  const [busy, setBusy] = useState(false);

  // Manual
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");

  // Extract
  const [text, setText] = useState("");
  const [extracted, setExtracted] = useState<ExtractedTopic[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Kairos
  const [kairosSubjects, setKairosSubjects] = useState<KairosSubject[] | null>(null);
  const [loadingKairos, setLoadingKairos] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());

  function reset() {
    setTitle(""); setSummary(""); setCategory(""); setTags("");
    setText(""); setExtracted(null); setSelected(new Set());
    setKairosSubjects(null); setSelectedSubjects(new Set());
    setBusy(false); setLoadingKairos(false);
  }

  useEffect(() => {
    if (tab === "kairos" && kairosSubjects === null && !loadingKairos) {
      setLoadingKairos(true);
      fetch("/api/bridge/kairos")
        .then((r) => r.json())
        .then((d) => setKairosSubjects(d.subjects ?? []))
        .catch(() => setKairosSubjects([]))
        .finally(() => setLoadingKairos(false));
    }
  }, [tab, kairosSubjects, loadingKairos]);

  async function onCreateManual() {
    if (!title.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          summary: summary.trim() || null,
          category: category.trim() || null,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error");
      toast.success("Tema creado.");
      setOpen(false); reset(); router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function onExtract() {
    if (text.trim().length < 50) { toast.error("Pega al menos un párrafo."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/topics/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Error extrayendo");
      setExtracted(body.topics as ExtractedTopic[]);
      setSelected(new Set((body.topics as ExtractedTopic[]).map((_, i) => i)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function onConfirmExtracted() {
    if (!extracted) return;
    setBusy(true);
    try {
      const chosen = Array.from(selected).map((i) => extracted[i]);
      await Promise.all(
        chosen.map((t) =>
          fetch("/api/topics", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(t),
          })
        )
      );
      toast.success(`${chosen.length} ${chosen.length === 1 ? "tema creado" : "temas creados"}.`);
      setOpen(false); reset(); router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function onImportFromKairos() {
    if (!kairosSubjects || selectedSubjects.size === 0) return;
    setBusy(true);
    try {
      const chosen = kairosSubjects.filter((s) => selectedSubjects.has(s.id));
      await Promise.all(
        chosen.map((s) =>
          fetch("/api/topics", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              title: s.name,
              summary: s.professor ? `Materia con ${s.professor}` : null,
              category: s.term ?? null,
              tags: [s.name.toLowerCase().replace(/\s+/g, "-")],
              source_note_ids: s.session_ids,
              kairos_subject_id: s.id,
              kairos_color: s.color ?? null,
            }),
          })
        )
      );
      toast.success(
        `${chosen.length} ${chosen.length === 1 ? "materia importada" : "materias importadas"} de Kairos.`
      );
      setOpen(false); reset(); router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  const TABS = [
    { key: "manual" as const, label: "Manual", icon: FileText },
    { key: "extract" as const, label: "Extraer de texto", icon: Sparkles },
    { key: "kairos" as const, label: "Desde Kairos", icon: BookOpen },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="spark" size="sm">
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          Nuevo tema
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nuevo tema</DialogTitle>
          <DialogDescription>
            Un tema es una unidad atómica de conocimiento que vas a entrenar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-1 border-b border-white/[0.06] -mt-2">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm transition-colors ${
                tab === key
                  ? "text-foreground border-b-2 border-white/70"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
              {label}
            </button>
          ))}
        </div>

        {tab === "manual" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="ej. Algoritmo de Dijkstra" autoFocus />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="summary">Resumen</Label>
              <Textarea id="summary" value={summary} onChange={(e) => setSummary(e.target.value)}
                placeholder="Una frase que explique de qué trata." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="category">Categoría</Label>
                <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)}
                  placeholder="ej. Algoritmos" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="tags">Etiquetas (separadas por coma)</Label>
                <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)}
                  placeholder="grafos, ruta-corta" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={onCreateManual} disabled={busy || !title.trim()}>
                {busy ? "Creando…" : "Crear tema"}
              </Button>
            </div>
          </div>
        )}

        {tab === "extract" && (
          <div className="flex flex-col gap-4">
            {!extracted ? (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="text">Pega el texto fuente</Label>
                  <Textarea id="text" value={text} onChange={(e) => setText(e.target.value)}
                    placeholder="Apuntes de clase, capítulo del libro, transcripción…" rows={10} />
                  <p className="text-xs text-muted-foreground">
                    Spark detectará los conceptos atómicos y los preparará para entrenar.
                  </p>
                </div>
                <div className="flex justify-end">
                  <Button onClick={onExtract} disabled={busy || text.trim().length < 50}>
                    {busy ? "Analizando…" : "Extraer conceptos"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="text-sm text-muted-foreground">
                  Encontré {extracted.length} {extracted.length === 1 ? "concepto" : "conceptos"}. Marca los que quieres guardar.
                </div>
                <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
                  {extracted.map((t, i) => {
                    const isSelected = selected.has(i);
                    return (
                      <button key={i} onClick={() => {
                        const next = new Set(selected);
                        if (isSelected) next.delete(i); else next.add(i);
                        setSelected(next);
                      }} className={`text-left p-3 rounded-md border transition-colors ${
                        isSelected ? "border-spark/40 bg-spark/[0.05]" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                      }`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-1">{t.category}</div>
                            <div className="font-medium text-sm">{t.title}</div>
                            <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{t.summary}</div>
                          </div>
                          <div className={`w-5 h-5 rounded shrink-0 border flex items-center justify-center transition-colors ${
                            isSelected ? "bg-spark border-spark" : "border-white/20"
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-background" strokeWidth={2.5} />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <button onClick={() => { setExtracted(null); setSelected(new Set()); }}
                    className="text-xs text-muted-foreground hover:text-foreground">
                    Volver a editar texto
                  </button>
                  <Button onClick={onConfirmExtracted} disabled={busy || selected.size === 0}>
                    {busy ? "Guardando…" : `Guardar ${selected.size}`}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {tab === "kairos" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Importa tus materias de Kairos como temas. Spark usará tus notas de clase como contexto en cada sesión.
            </p>

            {loadingKairos && (
              <div className="text-sm text-muted-foreground italic">Cargando materias…</div>
            )}

            {kairosSubjects !== null && kairosSubjects.length === 0 && (
              <div className="text-sm text-muted-foreground p-4 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                No se encontraron materias en Kairos. Crea algunas desde Kairos primero.
              </div>
            )}

            {kairosSubjects !== null && kairosSubjects.length > 0 && (
              <>
                <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
                  {kairosSubjects.map((s) => {
                    const isSelected = selectedSubjects.has(s.id);
                    // s.emoji puede ser un emoji real ("📚") o un nombre de ícono ("book-open")
                    // Solo mostramos el emoji si contiene un carácter fuera del rango ASCII
                    const realEmoji = s.emoji && /[^\x00-\x7F]/.test(s.emoji) ? s.emoji : null;
                    const accentColor = s.color ?? null;
                    return (
                      <button key={s.id} onClick={() => {
                        const next = new Set(selectedSubjects);
                        if (isSelected) next.delete(s.id); else next.add(s.id);
                        setSelectedSubjects(next);
                      }} className={`text-left p-3 rounded-lg border transition-colors ${
                        isSelected
                          ? "border-white/20 bg-white/[0.05]"
                          : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10"
                      }`}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Indicador izquierdo: emoji real o ícono genérico con color */}
                            <div
                              className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-base"
                              style={{
                                background: accentColor
                                  ? `${accentColor}18`
                                  : "rgba(255,255,255,0.04)",
                                border: `1px solid ${accentColor ? `${accentColor}30` : "rgba(255,255,255,0.07)"}`,
                              }}
                            >
                              {realEmoji
                                ? realEmoji
                                : <BookOpen
                                    className="w-4 h-4"
                                    strokeWidth={1.5}
                                    style={{ color: accentColor ?? "rgba(255,255,255,0.4)" }}
                                  />
                              }
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">{s.name}</div>
                              <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 flex-wrap">
                                {s.session_count} {s.session_count === 1 ? "clase" : "clases"}
                                {s.professor && <><span className="opacity-40">·</span><span>{s.professor}</span></>}
                                {s.term && <><span className="opacity-40">·</span><span>{s.term}</span></>}
                              </div>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded shrink-0 border flex items-center justify-center transition-colors ${
                            isSelected ? "bg-foreground border-foreground" : "border-white/20"
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-background" strokeWidth={2.5} />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={onImportFromKairos}
                    disabled={busy || selectedSubjects.size === 0}
                  >
                    {busy
                      ? "Importando…"
                      : selectedSubjects.size > 0
                        ? `Importar ${selectedSubjects.size} ${selectedSubjects.size === 1 ? "materia" : "materias"}`
                        : "Importar materias"
                    }
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
