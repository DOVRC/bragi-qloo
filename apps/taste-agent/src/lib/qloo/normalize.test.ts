import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { extractTagNames, humanizeTagId, normalizeQlooEntities, normalizeTags } from "./normalize";

const dir = dirname(fileURLToPath(import.meta.url));

describe("normalizeQlooEntities", () => {
  it("normalizes search fixture with entity_id and id", () => {
    const payload = JSON.parse(
      readFileSync(join(dir, "__fixtures__/search-radiohead.json"), "utf8"),
    );
    const entities = normalizeQlooEntities(payload);
    expect(entities).toHaveLength(2);
    expect(entities[0]).toMatchObject({
      id: "AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE",
      name: "Radiohead",
      type: "urn:entity:artist",
    });
    expect(entities[1].id).toBe("FFFFFFFF-0000-1111-2222-333333333333");
  });

  it("normalizes nested insights results.entities", () => {
    const payload = JSON.parse(
      readFileSync(join(dir, "__fixtures__/insights-artists.json"), "utf8"),
    );
    const entities = normalizeQlooEntities(payload);
    expect(entities.map((e) => e.name)).toEqual(["Thom Yorke", "Portishead"]);
    const tags = extractTagNames(payload);
    expect(tags).toEqual(
      expect.arrayContaining(["experimental", "electronic", "trip hop", "experimental jazz"]),
    );
  });

  it("returns empty array for garbage", () => {
    expect(normalizeQlooEntities(null)).toEqual([]);
    expect(normalizeQlooEntities({ results: [{ name: "No id" }] })).toEqual([]);
  });

  it("humanizes tag urn leaves", () => {
    expect(humanizeTagId("urn:tag:genre:qloo:alternative_rock")).toBe("alternative rock");
  });

  it("normalizes tags search payload", () => {
    const tags = normalizeTags({
      results: { tags: [{ id: "urn:tag:genre:qloo:jazz", name: "Jazz" }] },
    });
    expect(tags[0]).toEqual({ id: "urn:tag:genre:qloo:jazz", name: "Jazz" });
  });
});
