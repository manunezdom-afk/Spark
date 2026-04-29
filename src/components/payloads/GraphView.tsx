import { ArrowRight } from "lucide-react";
import type { GraphNodePayload } from "@/modules/spark/types";

export function GraphView({ payload }: { payload: GraphNodePayload }) {
  const byCategory = new Map<string, typeof payload.nodes>();
  for (const n of payload.nodes) {
    const list = byCategory.get(n.category) ?? [];
    list.push(n);
    byCategory.set(n.category, list);
  }

  return (
    <div className="flex flex-col gap-5">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        Conexiones detectadas
      </span>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Array.from(byCategory.entries()).map(([cat, nodes]) => (
          <div key={cat} className="p-4 rounded-md border border-white/[0.06] bg-white/[0.02]">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-spark mb-2">
              {cat}
            </div>
            <ul className="flex flex-col gap-1.5">
              {nodes.map((n, i) => (
                <li key={i} className="text-sm">
                  · {n.label}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {payload.edges.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Relaciones
          </div>
          <ul className="flex flex-col gap-1.5">
            {payload.edges.map((e, i) => (
              <li key={i} className="flex items-center gap-2 text-sm flex-wrap">
                <span className="text-foreground">{e.source}</span>
                <ArrowRight className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} />
                <span className="text-spark italic">{e.relationship}</span>
                <ArrowRight className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} />
                <span className="text-foreground">{e.target}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
