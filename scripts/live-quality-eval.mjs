/**
 * Bounded live Qloo quality probe — writes docs/LIVE_QUALITY.json (no secrets).
 * Run: node --env-file=.env.local scripts/live-quality-eval.mjs
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const base = process.env.BRAGI_EVAL_BASE || "https://bragi-qloo.vercel.app";

const PROFILES = [
  { id: "alt-rock", signals: ["Radiohead", "alternative rock"], intent: "creators" },
  { id: "hip-hop", signals: ["hip hop", "rap"], intent: "creators" },
  { id: "experimental", signals: ["experimental music", "ambient"], intent: "creators" },
  { id: "visual", signals: ["Studio Ghibli", "animation"], intent: "places" },
  { id: "indie-art", signals: ["indie rock", "contemporary art"], intent: "mixed" },
  { id: "jazz", signals: ["jazz", "improvisation"], intent: "mixed" },
];

async function runOne(profile) {
  const started = Date.now();
  const res = await fetch(`${base}/api/discover`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      signals: profile.signals,
      intent: profile.intent,
      city: "Medellín",
    }),
  });
  const ms = Date.now() - started;
  const json = await res.json();
  if (!json.ok) {
    return {
      id: profile.id,
      ok: false,
      ms,
      error: json.error?.message || `HTTP ${res.status}`,
    };
  }
  const recs = json.recommendations || [];
  return {
    id: profile.id,
    ok: true,
    ms,
    mode: json.mode,
    resolved: (json.profile?.resolvedEntities || []).map((e) => e.name),
    affinities: (json.profile?.affinityEntities || []).slice(0, 10).map((e) => e.name),
    recommendations: recs.map((r) => ({
      name: r.entry?.name,
      kind: r.entry?.kind,
      city: r.entry?.city,
      path: r.rankingPath,
      score: r.score,
      qlooInsightsPoints: r.qlooInsightsPoints,
      qlooSearchPoints: r.qlooSearchPoints,
      userSignalPoints: r.userSignalPoints,
    })),
    creatorCount: recs.filter((r) => r.entry?.kind === "creator").length,
    projectCount: recs.filter((r) => r.entry?.kind === "project").length,
    geoOk: recs.every((r) => /medell/i.test(r.entry?.city || "")),
    warnings: (json.warnings || []).slice(0, 8),
  };
}

const rows = [];
for (const p of PROFILES) {
  try {
    rows.push(await runOne(p));
  } catch (err) {
    rows.push({ id: p.id, ok: false, error: String(err?.message || err) });
  }
  await new Promise((r) => setTimeout(r, 800));
}

const out = {
  generatedAt: new Date().toISOString(),
  base,
  note: "Human review required for cultural sense; metrics are descriptive only.",
  rows,
};

const path = resolve(__dirname, "../docs/LIVE_QUALITY.json");
writeFileSync(path, JSON.stringify(out, null, 2));
console.log(`Wrote ${path}`);
console.log(
  rows
    .map(
      (r) =>
        `${r.id}: ok=${r.ok} creators=${r.creatorCount ?? "-"} geoOk=${r.geoOk ?? "-"} ms=${r.ms ?? "-"}`,
    )
    .join("\n"),
);
