/**
 * Live Qloo connectivity check. Requires QLOO_API_KEY in env or .env.local.
 * Never prints the API key.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { QlooService } from "../src/lib/qloo/client";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
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

async function main() {
  loadEnvLocal();
  const qloo = new QlooService();
  if (!qloo.hasCredentials()) {
    console.error("FAIL: QLOO_API_KEY not configured. Use `qloo setup --qloo` or .env.local.");
    process.exit(1);
  }

  const result = await qloo.smokeTest();
  if (!result.ok) {
    console.error(`FAIL: ${result.error.code} — ${result.error.message}`);
    process.exit(1);
  }

  console.log(`OK: Qloo search smoke test succeeded (entities returned: ${result.entityCount}).`);
}

main().catch((err) => {
  console.error("FAIL:", err instanceof Error ? err.message : err);
  process.exit(1);
});
