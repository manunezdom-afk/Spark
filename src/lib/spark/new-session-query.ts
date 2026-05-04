export function getInitialSelectedTopicIds({
  topic,
  topicIds,
  max,
}: {
  topic: string | null;
  topicIds: string | null;
  max: number;
}): string[] {
  const rawIds = topicIds
    ? topicIds.split(",")
    : topic
      ? [topic]
      : [];

  return rawIds
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, Math.max(0, max));
}

export function getNewSessionStepCount(selectedTopicCount: number): number {
  return selectedTopicCount > 0 ? 4 : 3;
}
