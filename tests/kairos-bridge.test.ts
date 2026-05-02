import { describe, expect, it } from "vitest";

import {
  buildKairosContext,
  expandKairosDescendants,
  type KairosSnapshot,
} from "@/lib/spark/kairos-bridge";

function fakeDb(snapshot: KairosSnapshot) {
  return {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                single: async () => ({
                  data: { data: { state: snapshot } },
                  error: null,
                }),
              };
            },
          };
        },
      };
    },
  };
}

describe("kairos bridge", () => {
  it("expands a selected parent session to its descendant subpages", () => {
    const snapshot: KairosSnapshot = {
      sessions: [
        { id: "root", subjectId: "subj", title: "Unidad raiz" },
        {
          id: "child",
          subjectId: "subj",
          parentSessionId: "root",
          title: "Subpagina especifica",
        },
      ],
    };

    expect(expandKairosDescendants(snapshot, ["root"]).sort()).toEqual([
      "child",
      "root",
    ]);
  });

  it("builds Nova context from child subpages when the topic points at a parent session", async () => {
    const snapshot: KairosSnapshot = {
      sessions: [
        { id: "root", subjectId: "subj", title: "Unidad raiz" },
        {
          id: "child",
          subjectId: "subj",
          parentSessionId: "root",
          title: "Cruces monohibridos",
        },
      ],
      blocks: [
        {
          id: "block_1",
          sessionId: "child",
          type: "concepto",
          order: 1,
          title: "Proporcion 3:1",
          body: "En dominancia completa, Aa x Aa produce tres fenotipos dominantes por uno recesivo.",
        },
      ],
      extractions: [],
    };

    const context = await buildKairosContext(
      fakeDb(snapshot) as never,
      "user_1",
      ["root"],
    );

    expect(context).toContain("Cruces monohibridos");
    expect(context).toContain("Proporcion 3:1");
  });
});
