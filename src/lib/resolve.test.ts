import { describe, expect, it } from "vitest";
import { pickBestEntity, scoreNameMatch } from "./resolve";

describe("scoreNameMatch", () => {
  it("scores exact Studio Ghibli highly", () => {
    expect(scoreNameMatch("Studio Ghibli", "Studio Ghibli")).toBe(100);
  });

  it("scores unrelated studio names low", () => {
    expect(scoreNameMatch("Studio Ghibli", "Picsart Photo Studio")).toBeLessThan(40);
  });

  it("rejects incomplete short-prefix Post for post-punk", () => {
    expect(scoreNameMatch("post-punk", "Post")).toBe(0);
    expect(scoreNameMatch("post punk", "Post")).toBe(0);
  });

  it("keeps exact Post and longer valid names", () => {
    expect(scoreNameMatch("Post", "Post")).toBe(100);
    expect(scoreNameMatch("alternative rock", "Alternative Rock")).toBe(100);
    expect(scoreNameMatch("Radiohead", "Radiohead")).toBe(100);
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

  it("does not resolve post-punk to Post even with high popularity", () => {
    const best = pickBestEntity(
      "post-punk",
      [
        { id: "1", name: "Post", popularity: 0.999 },
        { id: "2", name: "Post Malone", popularity: 0.9 },
      ],
      25,
    );
    expect(best?.name).not.toBe("Post");
  });
});
