// Helpers para emitir Server-Sent Events desde Route Handlers de Next.js.

export type SSEEvent = {
  event: string;
  data: unknown;
  id?: string;
};

export function encodeSSE(event: SSEEvent): string {
  const lines: string[] = [];
  if (event.id) lines.push(`id: ${event.id}`);
  lines.push(`event: ${event.event}`);
  lines.push(`data: ${JSON.stringify(event.data)}`);
  lines.push("", ""); // blank line terminates the event
  return lines.join("\n");
}

export function sseStream(
  generator: (push: (event: SSEEvent) => void, close: () => void) => Promise<void>
): Response {
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const push = (event: SSEEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(encodeSSE(event)));
        } catch {
          closed = true;
        }
      };
      const close = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          /* noop */
        }
      };

      try {
        await generator(push, close);
      } catch (err) {
        push({
          event: "error",
          data: { message: err instanceof Error ? err.message : "stream error" },
        });
      } finally {
        close();
      }
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
      connection: "keep-alive",
    },
  });
}

export function extractJsonPayload<T>(text: string): T | null {
  const match = text.match(/```json\s*\n?([\s\S]*?)\n?```/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as T;
  } catch {
    return null;
  }
}

export function stripJsonBlock(text: string): string {
  return text.replace(/```json\s*\n?[\s\S]*?\n?```/g, "").trim();
}
