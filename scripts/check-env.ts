/**
 * Reports whether required env vars are present without printing secret values.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) {
    console.log("ENV_FILE: missing");
    return;
  }
  console.log("ENV_FILE: present");
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

loadEnvLocal();

const keys = ["QLOO_API_KEY", "QLOO_API_BASE_URL", "SAMPLE_DATA_MODE"] as const;
for (const key of keys) {
  const value = process.env[key];
  if (value == null || value === "") {
    console.log(`${key}: ABSENT`);
    continue;
  }
  if (key === "SAMPLE_DATA_MODE" || key === "QLOO_API_BASE_URL") {
    console.log(`${key}: ${value}`);
    continue;
  }
  console.log(`${key}: PRESENT (len=${value.length}, redacted)`);
}
