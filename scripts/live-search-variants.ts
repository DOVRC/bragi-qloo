/** Probe search query/type variants; sanitized output only. */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
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

function redact(id: string) {
  return id.length <= 8 ? "***" : `${id.slice(0, 4)}…${id.slice(-4)}`;
}

async function trySearch(
  qloo: QlooService,
  label: string,
  query: string,
  types?: string[],
) {
  try {
    const entities = await qloo.searchEntities({
      query,
      types: types as never,
      take: 3,
    });
    console.log(label, {
      count: entities.length,
      names: entities.map((e) => ({
        name: e.name,
        id: redact(e.id),
        type: e.type ?? null,
        pop: e.popularity ?? null,
      })),
    });
  } catch (err) {
    console.log(label, {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

async function main() {
  loadEnvLocal();
  const qloo = new QlooService();
  const cases: Array<[string, string, string[] | undefined]> = [
    ["ghibli none", "Studio Ghibli", undefined],
    ["ghibli brand", "Studio Ghibli", ["urn:entity:brand"]],
    ["ghibli movie", "Studio Ghibli", ["urn:entity:movie"]],
    ["spirited away movie", "Spirited Away", ["urn:entity:movie"]],
    ["my neighbor totoro", "My Neighbor Totoro", ["urn:entity:movie"]],
    ["experimental jazz none", "experimental jazz", undefined],
    ["jazz artist", "jazz", ["urn:entity:artist"]],
    ["miles davis", "Miles Davis", ["urn:entity:artist"]],
    ["reggaeton none", "reggaeton", undefined],
    ["bad bunny", "Bad Bunny", ["urn:entity:artist"]],
    ["nike brand", "Nike", ["urn:entity:brand"]],
    ["salsa dance", "salsa", ["urn:entity:artist"]],
  ];
  for (const [label, query, types] of cases) {
    await trySearch(qloo, label, query, types);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
