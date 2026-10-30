/**
 * Minimal live Qloo probe. Prints sanitized summaries only — no secrets, no full payloads.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { QlooService } from "../src/lib/qloo/client";
import { normalizeQlooEntities, extractTagNames } from "../src/lib/qloo/normalize";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function redactId(id: string): string {
  if (id.length <= 8) return "***";
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}

function summarizeEntity(e: { id: string; name: string; type?: string; popularity?: number }) {
  return {
    name: e.name,
    type: e.type ?? null,
    id: redactId(e.id),
    popularity: e.popularity ?? null,
  };
}

function payloadShape(payload: unknown): string {
  if (!payload || typeof payload !== "object") return typeof payload;
  const root = payload as Record<string, unknown>;
  const keys = Object.keys(root).slice(0, 12);
  const results = root.results;
  let resultsInfo = "";
  if (Array.isArray(results)) resultsInfo = `results[array:${results.length}]`;
  else if (results && typeof results === "object") {
    const rk = Object.keys(results as object).slice(0, 8);
    resultsInfo = `results{${rk.join(",")}}`;
  }
  return `keys=[${keys.join(",")}] ${resultsInfo}`.trim();
}

async function main() {
  loadEnvLocal();
  if (process.env.SAMPLE_DATA_MODE === "true") {
    console.log("WARN: SAMPLE_DATA_MODE=true — probe still uses live QlooService directly.");
  }

  const qloo = new QlooService();
  if (!qloo.hasCredentials()) {
    console.error("BLOCKED: QLOO_API_KEY absent");
    process.exit(1);
  }
  console.log("AUTH: key present (redacted)");
  console.log(`BASE: ${process.env.QLOO_API_BASE_URL ?? "https://hackathon.api.qloo.com"}`);

  // 1) Search Radiohead
  const search = await qloo.searchEntities({
    query: "Radiohead",
    types: ["urn:entity:artist"],
    take: 3,
  });
  console.log("SEARCH Radiohead:", {
    count: search.length,
    top: search.slice(0, 2).map(summarizeEntity),
  });

  if (search.length === 0) {
    console.error("FAIL: search returned no entities");
    process.exit(1);
  }

  const entityId = search[0].id;

  // 2) Insights artists
  const insightsArtist = await qloo.getInsights({
    filterType: "urn:entity:artist",
    signalEntityIds: [entityId],
    take: 5,
  });
  console.log("INSIGHTS artist:", {
    count: insightsArtist.entities.length,
    tagsSample: insightsArtist.tags.slice(0, 6),
    shape: payloadShape(insightsArtist.raw),
    top: insightsArtist.entities.slice(0, 3).map(summarizeEntity),
  });

  // 3) Insights places Medellín
  const insightsPlace = await qloo.getInsights({
    filterType: "urn:entity:place",
    signalEntityIds: [entityId],
    locationQuery: "Medellín",
    take: 5,
  });
  console.log("INSIGHTS place+Medellín:", {
    count: insightsPlace.entities.length,
    tagsSample: insightsPlace.tags.slice(0, 6),
    shape: payloadShape(insightsPlace.raw),
    top: insightsPlace.entities.slice(0, 3).map(summarizeEntity),
  });

  // 4) Insights brand
  const insightsBrand = await qloo.getInsights({
    filterType: "urn:entity:brand",
    signalEntityIds: [entityId],
    take: 5,
  });
  console.log("INSIGHTS brand:", {
    count: insightsBrand.entities.length,
    top: insightsBrand.entities.slice(0, 3).map(summarizeEntity),
  });

  // 5) Search Studio Ghibli as movie
  const ghibli = await qloo.searchEntities({
    query: "Studio Ghibli",
    types: ["urn:entity:brand", "urn:entity:movie"],
    take: 3,
  });
  console.log("SEARCH Studio Ghibli:", {
    count: ghibli.length,
    top: ghibli.slice(0, 2).map(summarizeEntity),
  });

  // 6) Search reggaeton-ish
  const reggaeton = await qloo.searchEntities({
    query: "J Balvin",
    types: ["urn:entity:artist"],
    take: 2,
  });
  console.log("SEARCH J Balvin:", {
    count: reggaeton.length,
    top: reggaeton.slice(0, 2).map(summarizeEntity),
  });

  // Sanity: normalize empty
  console.log("NORMALIZE empty:", normalizeQlooEntities({}).length);
  console.log("TAGS empty:", extractTagNames({}).length);
  console.log("PROBE_OK");
}

main().catch((err) => {
  console.error(
    "PROBE_FAIL:",
    err && typeof err === "object" && "code" in err
      ? `${(err as { code: string }).code}: ${(err as Error).message}`
      : err instanceof Error
        ? err.message
        : err,
  );
  process.exit(1);
});
