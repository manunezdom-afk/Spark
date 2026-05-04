import { describe, it, expect } from "vitest";
import { extractJsonPayload, stripJsonBlock, encodeSSE } from "@/lib/streaming/sse";

describe("extractJsonPayload", () => {
  it("extracts a valid JSON block", () => {
    const text = "Algo previo.\n\n```json\n{\"type\":\"score\",\"score\":80}\n```";
    const out = extractJsonPayload<{ type: string; score: number }>(text);
    expect(out).toEqual({ type: "score", score: 80 });
  });

  it("returns null on missing block", () => {
    expect(extractJsonPayload("Sin JSON aquí.")).toBeNull();
  });

  it("returns null on malformed JSON", () => {
    const text = "```json\n{not valid\n```";
    expect(extractJsonPayload(text)).toBeNull();
  });

  it("handles JSON without leading newline", () => {
    const text = "```json{\"a\":1}```";
    const out = extractJsonPayload<{ a: number }>(text);
    expect(out).toEqual({ a: 1 });
  });
});

describe("stripJsonBlock", () => {
  it("removes the json block from text", () => {
    const text = "Texto. ```json\n{\"a\":1}\n```";
    expect(stripJsonBlock(text)).toBe("Texto.");
  });

  it("trims whitespace", () => {
    const text = "Hola.   ";
    expect(stripJsonBlock(text)).toBe("Hola.");
  });
});

describe("encodeSSE", () => {
  it("encodes event with data", () => {
    const out = encodeSSE({ event: "ping", data: { ok: true } });
    expect(out).toContain("event: ping");
    expect(out).toContain('data: {"ok":true}');
    expect(out.endsWith("\n\n")).toBe(true);
  });
});
