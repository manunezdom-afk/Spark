import { ArrowRight, Network } from "lucide-react";
import type { GraphNodePayload } from "@/modules/spark/types";

export function GraphView({ payload }: { payload: GraphNodePayload }) {
  const byCategory = new Map<string, typeof payload.nodes>();
  for (const n of payload.nodes) {
    const list = byCategory.get(n.category) ?? [];
    list.push(n);
    byCategory.set(n.category, list);
  }

  const categories = Array.from(byCategory.entries());

  return (
    <div className="flex flex-col gap-5 p-5 rounded-2xl border border-cyan-200/40 bg-cyan-50/30">
      <header className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-cyan-100 text-cyan-700">
          <Network className="w-4 h-4" strokeWidth={1.7} />
        </span>
        <div className="flex flex-col">
          <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-cyan-700">
            Conexiones detectadas
          </span>
          <span className="text-[12px] text-foreground/80">
            {payload.nodes.length} conceptos · {payload.edges.length} relaciones
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {categories.map(([cat, nodes], idx) => (
          <div
            key={cat}
            className="relative p-4 rounded-xl border border-cyan-200/50 bg-white/85 engine-card-rise"
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <div className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-cyan-700 mb-2">
              {cat}
            </div>
            <ul className="flex flex-col gap-1.5">
              {nodes.map((n, i) => (
                <li key={i} className="flex items-center gap-2 text-[13.5px] text-foreground/90">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-500" />
                  {n.label}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {payload.edges.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-cyan-700">
            Relaciones
          </div>
          <ul className="flex flex-col gap-2">
            {payload.edges.map((e, i) => (
              <li
                key={i}
                className="flex items-center gap-2 text-[13.5px] flex-wrap p-3 rounded-xl border border-cyan-200/40 bg-white/60"
              >
                <span className="font-medium text-foreground">{e.source}</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-500" strokeWidth={1.7} />
                <span
                  className="px-2 py-0.5 rounded-full text-[11px] italic"
                  style={{
                    background: "rgba(8, 145, 178, 0.10)",
                    color: "rgb(14, 116, 144)",
                  }}
                >
                  {e.relationship}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-500" strokeWidth={1.7} />
                <span className="font-medium text-foreground">{e.target}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
