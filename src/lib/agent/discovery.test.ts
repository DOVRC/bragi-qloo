import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { QlooService } from "@/lib/qloo/client";
import { DiscoveryAgent, planInsights } from "./discovery";
import { parseDiscoverInput } from "@/lib/signals";

const dir = dirname(fileURLToPath(import.meta.url));
const fixtures = join(dir, "../qloo/__fixtures__");

describe("planInsights", () => {
  it("includes movie insights for Ghibli profile and brand for fashion profile", () => {
    const a = parseDiscoverInput({
      query: "I love Radiohead, Studio Ghibli, and experimental jazz in Medellín",
    });
    const planA = planInsights(a.signals, [{ id: "1", name: "Radiohead" }], "Medellín");
    expect(planA.some((p) => p.filterType === "urn:entity:artist")).toBe(true);
    expect(planA.some((p) => p.filterType === "urn:entity:movie")).toBe(true);

    const b = parseDiscoverInput({
      query: "I love reggaeton, urban fashion, and latin dance in Medellín",
    });
    const planB = planInsights(b.signals, [{ id: "2", name: "Bad Bunny" }], "Medellín");
    expect(planB.some((p) => p.filterType === "urn:entity:brand")).toBe(true);
    expect(planB.some((p) => p.filterType === "urn:entity:artist")).toBe(true);
  });
});

describe("DiscoveryAgent", () => {
  it("runs multi-step live workflow with mocked Qloo", async () => {
    const search = JSON.parse(
      readFileSync(join(fixtures, "search-radiohead.json"), "utf8"),
    );
    const insights = JSON.parse(
      readFileSync(join(fixtures, "insights-artists.json"), "utf8"),
    );
    const tags = {
      success: true,
      results: {
        tags: [{ id: "urn:tag:genre:qloo:jazz", name: "Jazz" }],
      },
    };

    const fetchImpl: typeof fetch = async (input) => {
      const url = String(input);
      if (url.includes("/v2/tags")) {
        return new Response(JSON.stringify(tags), { status: 200 });
      }
      if (url.includes("/search")) {
        // Return Radiohead for any search so name-match works for first signal;
        // for other signals return empty-ish unrelated to force partial resolution path.
        if (/query=Radiohead/i.test(url) || /query=radiohead/i.test(decodeURIComponent(url))) {
          return new Response(JSON.stringify(search), { status: 200 });
        }
        // Provide a matching Studio Ghibli payload for untyped/ghibli queries
        if (/Ghibli/i.test(decodeURIComponent(url))) {
          return new Response(
            JSON.stringify({
              results: [
                {
                  entity_id: "GHIBLI-ID-0001",
                  name: "Studio Ghibli",
                  popularity: 0.8,
                },
              ],
            }),
            { status: 200 },
          );
        }
        if (/jazz/i.test(decodeURIComponent(url))) {
          return new Response(
            JSON.stringify({
              results: [
                {
                  entity_id: "JAZZ-ID-0001",
                  name: "Jazz At Lincoln Center",
                  popularity: 0.9,
                },
              ],
            }),
            { status: 200 },
          );
        }
        return new Response(JSON.stringify({ results: [] }), { status: 200 });
      }
      if (url.includes("/v2/insights")) {
        return new Response(JSON.stringify(insights), { status: 200 });
      }
      return new Response("not found", { status: 404 });
    };

    const qloo = new QlooService({
      apiKey: "test-key-not-real",
      fetchImpl,
    });

    const agent = new DiscoveryAgent({ qloo, sampleDataMode: false });
    const result = await agent.run({
      query:
        "I love Radiohead, Studio Ghibli, and experimental jazz. Help me find a cultural experience in Medellín with a budget of COP 100,000.",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.mode).toBe("live");
    expect(result.steps.find((s) => s.id === "resolve")?.status).toBe("done");
    expect(result.profile.resolvedEntities.some((e) => e.name === "Radiohead")).toBe(true);
    expect(result.recommendations.length).toBeLessThanOrEqual(3);
  });

  it("fails clearly without credentials (no silent fake data)", async () => {
    const qloo = new QlooService({ apiKey: "" });
    const agent = new DiscoveryAgent({ qloo, sampleDataMode: false });
    const result = await agent.run({ query: "I love Radiohead" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("MISSING_API_KEY");
    expect(result.mode).toBe("live");
  });

  it("sample mode is labeled and still returns structured recommendations", async () => {
    const agent = new DiscoveryAgent({ sampleDataMode: true });
    const result = await agent.run({
      query: "I love Radiohead and Studio Ghibli in Medellín budget COP 100000",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.mode).toBe("sample");
    expect(result.warnings.some((w) => /sample-data mode/i.test(w))).toBe(true);
  });
});
