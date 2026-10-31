import { describe, expect, it } from "vitest";
import {
  classifySignal,
  selectSignalsForResolution,
  validateDiscoverRequest,
  MAX_RESOLVE_SIGNALS,
} from "./signals";

describe("selectSignalsForResolution", () => {
  it("keeps priority refinement signals inside the 5-signal Search budget", () => {
    const signals = [
      "Radiohead",
      "Studio Ghibli",
      "experimental jazz",
      "Miles Davis",
      "Arcade Fire",
      "Thom Yorke",
      "Beck",
    ].map((raw) => classifySignal(raw));

    const selected = selectSignalsForResolution(signals, {
      priorityRaws: ["Thom Yorke", "Beck"],
      limit: MAX_RESOLVE_SIGNALS,
    });

    expect(selected).toHaveLength(5);
    expect(selected.map((s) => s.raw)).toEqual([
      "Thom Yorke",
      "Beck",
      "Radiohead",
      "Studio Ghibli",
      "experimental jazz",
    ]);
    expect(selected.map((s) => s.raw)).not.toContain("Miles Davis");
  });

  it("does not invent signals outside the provided list", () => {
    const signals = ["Radiohead", "jazz"].map((raw) => classifySignal(raw));
    const selected = selectSignalsForResolution(signals, {
      priorityRaws: ["Made Up Affinity"],
      limit: 5,
    });
    expect(selected.map((s) => s.raw)).toEqual(["Radiohead", "jazz"]);
  });
});

describe("validateDiscoverRequest prioritySignals", () => {
  it("accepts prioritySignals for feedback refinements", () => {
    const r = validateDiscoverRequest({
      query: "tastes",
      signals: ["Radiohead", "Studio Ghibli", "experimental jazz", "Miles Davis", "Arcade Fire", "Beck"],
      prioritySignals: ["Beck"],
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.prioritySignals).toEqual(["Beck"]);
  });
});
