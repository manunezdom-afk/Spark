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
  generator: (
    push: (event: SSEEvent) => void,
    close: () => void,
    signal: AbortSignal,
  ) => Promise<void>,
): Response {
  const encoder = new TextEncoder();
  // The AbortController fires when the client disconnects (navigates away,
  // closes the tab, etc.). Generators that own an upstream call — Anthropic
  // streams especially — must pass this signal through so the upstream is
  // cancelled too. Without it, Anthropic keeps generating tokens that nobody
  // will ever read.
  const abortController = new AbortController();
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
        await generator(push, close, abortController.signal);
      } catch (err) {
        if (!abortController.signal.aborted) {
          push({
            event: "error",
            data: { message: err instanceof Error ? err.message : "stream error" },
          });
        }
      } finally {
        close();
      }
    },
    cancel() {
      closed = true;
      abortController.abort();
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
  // Walk every ```json ... ``` block and return the LAST one that parses.
  // Nova frequently writes prose with backticks before the real payload, and
  // the legacy "first match" behavior swallowed the intended JSON when the
  // earlier block was prose-only or malformed.
  const blocks = [...text.matchAll(/```json\s*\n?([\s\S]*?)\n?```/g)];
  for (let i = blocks.length - 1; i >= 0; i--) {
    try {
      return JSON.parse(blocks[i][1]) as T;
    } catch {
      // try the previous block
    }
  }
  return null;
}

export function stripJsonBlock(text: string): string {
  return text.replace(/```json\s*\n?[\s\S]*?\n?```/g, "").trim();
}
