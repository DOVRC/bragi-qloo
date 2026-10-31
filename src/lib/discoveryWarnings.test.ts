import { describe, expect, it } from "vitest";
import { partitionDiscoveryWarnings } from "@/lib/discoveryWarnings";

describe("partitionDiscoveryWarnings", () => {
  it("keeps feedback and correctness messages user-facing", () => {
    const { userFacing, technical } = partitionDiscoveryWarnings([
      "Excluded 1 catalogue id(s) from feedback (Not my style).",
      "Qloo-native Insights elapsed 165ms.",
      "Discovery wall time 4091ms (deadline 50000ms).",
      "More like “Ferales” — prioritized alternative rock for Qloo Search/Insights within the resolve budget.",
    ]);
    expect(userFacing.some((w) => /Not my style|More like/i.test(w))).toBe(true);
    expect(technical.some((w) => /elapsed|wall time/i.test(w))).toBe(true);
  });
});
