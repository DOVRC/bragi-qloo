/**
 * Live end-to-end discovery for two contrasting profiles. Sanitized output only.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DiscoveryAgent } from "../src/lib/agent/discovery";
import { QlooService } from "../src/lib/qloo/client";

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

function shortId(id: string) {
  return id.length <= 8 ? "***" : `${id.slice(0, 4)}…${id.slice(-4)}`;
}

async function runProfile(label: string, query: string) {
  console.log(`\n=== ${label} ===`);
  const agent = new DiscoveryAgent({
    qloo: new QlooService(),
    sampleDataMode: false,
  });
  const result = await agent.run({
    query,
    city: "Medellín",
    budgetCop: 100_000,
  });

  console.log("ok:", result.ok, "mode:", result.mode);
  if (!result.ok) {
    console.log("error:", result.error.code, result.error.message);
    console.log(
      "steps:",
      result.steps.map((s) => `${s.id}:${s.status}`).join(", "),
    );
    return result;
  }

  console.log(
    "steps:",
    result.steps.map((s) => `${s.id}:${s.status}${s.detail ? `(${s.detail.slice(0, 80)})` : ""}`).join(" | "),
  );
  console.log(
    "resolved:",
    result.profile.resolvedEntities.map((e) => `${e.name}/${shortId(e.id)}`),
  );
  console.log(
    "affinities:",
    result.profile.affinityEntities.slice(0, 6).map((e) => e.name),
  );
  console.log("tags:", result.profile.affinityTags.slice(0, 8));
  console.log(
    "recs:",
    result.recommendations.map((r) => `${r.entry.id}@${r.score.toFixed(1)}`),
  );
  console.log("warnings:", result.warnings.slice(0, 4));
  return result;
}

async function main() {
  loadEnvLocal();
  if (process.env.SAMPLE_DATA_MODE === "true") {
    console.error("REFUSING: SAMPLE_DATA_MODE=true — set false for live e2e");
    process.exit(1);
  }
  if (!process.env.QLOO_API_KEY) {
    console.error("BLOCKED: QLOO_API_KEY absent");
    process.exit(1);
  }

  const a = await runProfile(
    "Profile A",
    "I love Radiohead, Studio Ghibli, and experimental jazz. Help me find a cultural experience in Medellín with a budget of COP 100,000.",
  );
  const b = await runProfile(
    "Profile B",
    "I love reggaeton, urban fashion, and latin dance. Help me find a cultural experience in Medellín with a budget of COP 100,000.",
  );

  if (a.ok && b.ok) {
    const aIds = a.recommendations.map((r) => r.entry.id).join("|");
    const bIds = b.recommendations.map((r) => r.entry.id).join("|");
    console.log("\nDIFFERENTIATION:", aIds === bIds ? "SAME_TOP_SET" : "DIFFERENT_TOP_SET");
    console.log("A:", aIds || "(empty)");
    console.log("B:", bIds || "(empty)");
  }

  console.log("\nE2E_DONE");
}

main().catch((err) => {
  console.error("E2E_FAIL:", err instanceof Error ? err.message : err);
  process.exit(1);
});
