import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TopicMaterialPicker } from "@/components/topics/TopicMaterialPicker";
import type { SparkTopic } from "@/modules/spark/types";

const topic: SparkTopic = {
  id: "topic_1",
  user_id: "user_1",
  title: "Biologia",
  summary: null,
  source_note_ids: ["root"],
  tags: [],
  category: null,
  is_archived: false,
  is_demo: false,
  kairos_subject_id: "subj_1",
  kairos_color: null,
  created_at: "2026-05-02T00:00:00.000Z",
  updated_at: "2026-05-02T00:00:00.000Z",
};

describe("TopicMaterialPicker", () => {
  it("lets the user pick a specific material from the default full-subject state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        json: async () => ({
          materials: [
            {
              id: "note_1",
              title: "Cruces monohibridos",
              date: null,
              parent_id: null,
              block_count: 2,
              extraction_count: 0,
              has_children: false,
            },
          ],
        }),
      })),
    );
    const onChange = vi.fn();

    render(
      <TopicMaterialPicker
        topic={topic}
        engine="socratic"
        selected={new Set()}
        onChange={onChange}
      />,
    );

    const material = await screen.findByText("Cruces monohibridos");
    fireEvent.click(material.closest("button")!);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledTimes(1);
    });
    expect(Array.from(onChange.mock.calls[0][0] as Set<string>)).toEqual([
      "note_1",
    ]);
  });
});
