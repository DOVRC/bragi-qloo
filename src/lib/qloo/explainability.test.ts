import { describe, expect, it } from "vitest";
import { normalizeExplainability } from "./explainability";

describe("normalizeExplainability", () => {
  it("parses top-level query.explainability from Insights payloads", () => {
    const normalized = normalizeExplainability({
      query: {
        explainability: {
          "signal.interests.entities": { "0": 0.82, "1": 0.11 },
        },
      },
    });
    expect(normalized.available).toBe(true);
    expect(normalized.contributions.length).toBe(2);
    expect(normalized.contributions[0].score).toBeCloseTo(0.82);
  });

  it("surfaces warnings without fabricating contributions", () => {
    const normalized = normalizeExplainability({
      query: { explainability: { warning: "Could not compute explainability" } },
    });
    expect(normalized.available).toBe(true);
    expect(normalized.warning).toMatch(/Could not compute/);
    expect(normalized.contributions).toEqual([]);
  });

  it("returns unavailable when metadata is missing", () => {
    expect(normalizeExplainability({ results: { entities: [] } }).available).toBe(false);
  });
});
