import { describe, expect, it } from "vitest";
import {
  domainFromCatalogueCategory,
  domainFromQlooType,
  hasTraceableDomainChange,
} from "./domains";

describe("cultural domains", () => {
  it("maps Qloo types and catalogue categories", () => {
    expect(domainFromQlooType("urn:entity:artist")).toBe("music");
    expect(domainFromQlooType("urn:entity:movie")).toBe("film");
    expect(domainFromQlooType("urn:entity:place")).toBe("place");
    expect(domainFromCatalogueCategory("music")).toBe("music");
    expect(domainFromCatalogueCategory("visual_arts")).toBe("visual");
    expect(domainFromCatalogueCategory("experience")).toBe("place");
  });

  it("requires a real domain change for cross-domain", () => {
    expect(hasTraceableDomainChange(["music"], "place")).toBe(true);
    expect(hasTraceableDomainChange(["music"], "music")).toBe(false);
    expect(hasTraceableDomainChange(["other"], "place")).toBe(false);
    expect(hasTraceableDomainChange(["music", "film"], "visual")).toBe(true);
  });
});
