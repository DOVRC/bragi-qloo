import { describe, expect, it } from "vitest";
import {
  normalizeAggregateExplainability,
  normalizeCandidateExplainability,
} from "./explainability";

describe("explainability scopes", () => {
  it("parses candidate-specific explainability with scores", () => {
    const normalized = normalizeCandidateExplainability({
      query: {
        affinity: 0.74,
        explainability: {
          "signal.interests.entities": { "0": 0.82, "1": 0.11 },
        },
      },
    });
    expect(normalized.scope).toBe("candidate");
    expect(normalized.available).toBe(true);
    expect(normalized.contributions).toHaveLength(2);
    expect(normalized.contributions[0].score).toBeCloseTo(0.82);
  });

  it("does not treat warning-only as successful explainability", () => {
    const normalized = normalizeCandidateExplainability({
      query: { explainability: { warning: "Could not compute explainability" } },
    });
    expect(normalized.available).toBe(false);
    expect(normalized.warning).toMatch(/Could not compute/);
    expect(normalized.contributions).toEqual([]);
  });

  it("keeps aggregate explainability separate from candidate", () => {
    const aggregate = normalizeAggregateExplainability({
      query: {
        explainability: {
          "signal.interests.entities": { "0": 0.5 },
        },
      },
    });
    expect(aggregate.scope).toBe("aggregate");
    expect(aggregate.available).toBe(true);

    const candidate = normalizeCandidateExplainability({
      name: "Venue",
      query: { affinity: 0.7 },
    });
    expect(candidate.available).toBe(false);
    // Must not invent candidate contributions from a sibling aggregate payload
    expect(candidate.contributions).toEqual([]);
  });

  it("returns unavailable when metadata is missing", () => {
    expect(normalizeCandidateExplainability({ results: { entities: [] } }).available).toBe(false);
  });
});
