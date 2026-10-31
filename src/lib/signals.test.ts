import { describe, expect, it } from "vitest";
import { classifySignal, parseDiscoverInput, validateDiscoverRequest } from "./signals";

describe("validateDiscoverRequest", () => {
  it("rejects empty body", () => {
    const r = validateDiscoverRequest({});
    expect(r.ok).toBe(false);
  });

  it("accepts query", () => {
    const r = validateDiscoverRequest({
      query: "I love Radiohead and Studio Ghibli in Medellín with budget COP 100000",
    });
    expect(r.ok).toBe(true);
  });
});

describe("parseDiscoverInput", () => {
  it("extracts signals, city, and budget from the core journey example", () => {
    const parsed = parseDiscoverInput({
      query:
        "I love Radiohead, Studio Ghibli, and experimental jazz. Help me find a cultural experience in Medellín with a budget of COP 100,000.",
    });
    expect(parsed.city).toBe("Medellín");
    expect(parsed.budgetCop).toBe(100000);
    expect(parsed.signals.map((s) => s.raw.toLowerCase())).toEqual(
      expect.arrayContaining([
        expect.stringContaining("radiohead"),
        expect.stringContaining("ghibli"),
        expect.stringContaining("jazz"),
      ]),
    );
    const ghibli = parsed.signals.find((s) => /ghibli/i.test(s.raw));
    expect(ghibli?.inferredType).toBeUndefined();
    const jazz = parsed.signals.find((s) => /jazz/i.test(s.raw));
    expect(jazz?.kind).toBe("genre_or_theme");
  });
});

describe("classifySignal", () => {
  it("marks reggaeton as genre_or_theme", () => {
    expect(classifySignal("reggaeton").kind).toBe("genre_or_theme");
  });

  it("marks Radiohead as named artist entity", () => {
    const s = classifySignal("Radiohead");
    expect(s.kind).toBe("named_entity");
    expect(s.inferredType).toBe("urn:entity:artist");
  });

  it("does not invent an artist type for unknown named entities", () => {
    const s = classifySignal("Frida Kahlo");
    expect(s.kind).toBe("named_entity");
    expect(s.inferredType).toBeUndefined();
  });
});

describe("validateDiscoverRequest excludeEntryIds", () => {
  it("accepts bounded exclude ids for Not my style feedback", () => {
    const r = validateDiscoverRequest({
      query: "Radiohead",
      signals: ["Radiohead"],
      excludeEntryIds: ["teatro-pablo-tobon", "demo-atelier-norte"],
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.excludeEntryIds).toEqual([
        "teatro-pablo-tobon",
        "demo-atelier-norte",
      ]);
    }
  });
});
