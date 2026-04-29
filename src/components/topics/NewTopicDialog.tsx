"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, FileText, Check } from "lucide-react";
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

export function NewTopicDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"manual" | "extract">("manual");
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

  function reset() {
    setTitle("");
    setSummary("");
    setCategory("");
    setTags("");
    setText("");
    setExtracted(null);
    setSelected(new Set());
    setBusy(false);
  }

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
      setOpen(false);
      reset();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function onExtract() {
    if (text.trim().length < 50) {
      toast.error("Pega al menos un párrafo.");
      return;
    }
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
      setOpen(false);
      reset();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

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
          <button
            onClick={() => setTab("manual")}
            className={`px-4 py-2 text-sm transition-colors ${
              tab === "manual"
                ? "text-foreground border-b-2 border-spark"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="w-3.5 h-3.5 inline mr-2" strokeWidth={1.5} />
            Manual
          </button>
          <button
            onClick={() => setTab("extract")}
            className={`px-4 py-2 text-sm transition-colors ${
              tab === "extract"
                ? "text-foreground border-b-2 border-spark"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 inline mr-2" strokeWidth={1.5} />
            Extraer de texto
          </button>
        </div>

        {tab === "manual" ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ej. Algoritmo de Dijkstra"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="summary">Resumen</Label>
              <Textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Una frase que explique de qué trata."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="category">Categoría</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="ej. Algoritmos"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="tags">Etiquetas (separadas por coma)</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="grafos, ruta-corta"
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={onCreateManual} disabled={busy || !title.trim()}>
                {busy ? "Creando…" : "Crear tema"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {!extracted ? (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="text">Pega el texto fuente</Label>
                  <Textarea
                    id="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Apuntes de clase, capítulo del libro, transcripción…"
                    rows={10}
                  />
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
                <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto scrollbar-thin pr-1">
                  {extracted.map((t, i) => {
                    const isSelected = selected.has(i);
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          const next = new Set(selected);
                          if (isSelected) next.delete(i);
                          else next.add(i);
                          setSelected(next);
                        }}
                        className={`text-left p-3 rounded-md border transition-colors ${
                          isSelected
                            ? "border-spark/40 bg-spark/[0.05]"
                            : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-1">
                              {t.category}
                            </div>
                            <div className="font-medium text-sm">{t.title}</div>
                            <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                              {t.summary}
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded shrink-0 border flex items-center justify-center transition-colors ${
                              isSelected
                                ? "bg-spark border-spark"
                                : "border-white/20"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-background" strokeWidth={2.5} />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => { setExtracted(null); setSelected(new Set()); }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
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
      </DialogContent>
    </Dialog>
  );
}
