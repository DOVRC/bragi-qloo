import { describe, expect, it } from "vitest";
import { pickBestEntity, scoreNameMatch } from "./resolve";

describe("scoreNameMatch", () => {
  it("scores exact Studio Ghibli highly", () => {
    expect(scoreNameMatch("Studio Ghibli", "Studio Ghibli")).toBe(100);
  });

  it("scores unrelated studio names low", () => {
    expect(scoreNameMatch("Studio Ghibli", "Picsart Photo Studio")).toBeLessThan(40);
  });
});

describe("pickBestEntity", () => {
  it("rejects noisy typed search hits for Ghibli", () => {
    const best = pickBestEntity("Studio Ghibli", [
      { id: "1", name: "Picsart Photo Studio", popularity: 0.97 },
      { id: "2", name: "Alkaram Studio", popularity: 0.97 },
    ]);
    expect(best).toBeNull();
  });

  it("accepts exact Ghibli match", () => {
    const best = pickBestEntity("Studio Ghibli", [
      { id: "1", name: "Picsart Photo Studio", popularity: 0.97 },
      { id: "2", name: "Studio Ghibli", popularity: 0.79 },
    ]);
    expect(best?.name).toBe("Studio Ghibli");
  });
});
