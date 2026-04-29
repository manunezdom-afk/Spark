// Client-side helper that consumes a Spark SSE response and dispatches events.

export type SSEHandlers = {
  "user-turn"?: (data: unknown) => void;
  "text-delta"?: (data: { chunk: string }) => void;
  payload?: (data: unknown) => void;
  warning?: (data: { message: string }) => void;
  done?: (data: { turn: unknown }) => void;
  error?: (data: { message: string }) => void;
};

export async function postSSE(
  url: string,
  body: unknown,
  handlers: SSEHandlers,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "text/event-stream" },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const text = await response.text();
    let message = text;
    try {
      const parsed = JSON.parse(text);
      message = parsed.error ?? text;
    } catch {
      /* keep raw text */
    }
    handlers.error?.({ message });
    return;
  }

  if (!response.body) {
    handlers.error?.({ message: "Sin cuerpo en la respuesta" });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      dispatchEvent(rawEvent, handlers);
    }
  }
  if (buffer.trim()) dispatchEvent(buffer, handlers);
}

function dispatchEvent(raw: string, handlers: SSEHandlers) {
  const lines = raw.split("\n");
  let event = "";
  let data = "";
  for (const line of lines) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) data += line.slice(5).trim();
  }
  if (!event) return;
  let parsed: unknown = data;
  try {
    parsed = JSON.parse(data);
  } catch {
    /* keep raw */
  }
  const handler = handlers[event as keyof SSEHandlers];
  // @ts-expect-error dynamic dispatch
  handler?.(parsed);
}
