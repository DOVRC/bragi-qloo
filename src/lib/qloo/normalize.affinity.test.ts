import { describe, expect, it } from "vitest";
import { normalizeQlooEntities } from "./normalize";

describe("popularity vs affinity normalization", () => {
  it("keeps popularity and query.affinity as distinct fields", () => {
    const [entity] = normalizeQlooEntities({
      results: {
        entities: [
          {
            entity_id: "AAA",
            name: "Teatro Pablo Tobón Uribe",
            popularity: 0.99,
            query: { affinity: 0.74, explainability: { "signal.interests.entities": { "0": 1 } } },
          },
        ],
      },
    });
    expect(entity.popularity).toBeCloseTo(0.99);
    expect(entity.affinity).toBeCloseTo(0.74);
    expect(entity.popularity).not.toBe(entity.affinity);
  });

  it("does not invent affinity from popularity alone", () => {
    const [entity] = normalizeQlooEntities({
      results: [{ entity_id: "BBB", name: "Place", popularity: 0.95 }],
    });
    expect(entity.popularity).toBeCloseTo(0.95);
    expect(entity.affinity).toBeUndefined();
  });

  it("leaves both undefined when neither field is present", () => {
    const [entity] = normalizeQlooEntities({
      results: [{ entity_id: "CCC", name: "Place" }],
    });
    expect(entity.popularity).toBeUndefined();
    expect(entity.affinity).toBeUndefined();
  });
});
