import { describe, expect, it } from "vitest";

import {
  getInitialSelectedTopicIds,
  getNewSessionStepCount,
} from "@/lib/spark/new-session-query";

describe("new session query parsing", () => {
  it("preselecciona todos los topic_ids válidos que vienen en la URL", () => {
    const selected = getInitialSelectedTopicIds({
      topic: null,
      topicIds: "topic_1,topic_2",
      max: 5,
    });

    expect(selected).toEqual(["topic_1", "topic_2"]);
  });

  it("mantiene compatibilidad con el parámetro legacy topic", () => {
    const selected = getInitialSelectedTopicIds({
      topic: "topic_legacy",
      topicIds: null,
      max: 2,
    });

    expect(selected).toEqual(["topic_legacy"]);
  });

  it("recorta la preselección al máximo permitido por el método", () => {
    const selected = getInitialSelectedTopicIds({
      topic: null,
      topicIds: "topic_1,topic_2,topic_3",
      max: 2,
    });

    expect(selected).toEqual(["topic_1", "topic_2"]);
  });

  it("cuenta el paso de material cuando hay varias materias seleccionadas", () => {
    expect(getNewSessionStepCount(2)).toBe(4);
  });
});
