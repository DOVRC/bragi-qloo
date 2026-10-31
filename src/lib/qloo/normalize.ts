import type { QlooEntity } from "@/lib/types";

/** Defensively extract entities from heterogeneous Qloo search/insights payloads. */
export function normalizeQlooEntities(payload: unknown): QlooEntity[] {
  if (!payload || typeof payload !== "object") return [];

  const root = payload as Record<string, unknown>;
  const candidates: unknown[] = [];

  if (Array.isArray(root.results)) candidates.push(...root.results);
  if (Array.isArray(root.entities)) candidates.push(...root.entities);

  const nestedResults = root.results;
  if (nestedResults && typeof nestedResults === "object" && !Array.isArray(nestedResults)) {
    const r = nestedResults as Record<string, unknown>;
    if (Array.isArray(r.entities)) candidates.push(...r.entities);
  }

  return candidates
    .map((item) => normalizeOne(item))
    .filter((e): e is QlooEntity => Boolean(e?.id && e?.name));
}

function normalizeOne(item: unknown): QlooEntity | null {
  if (!item || typeof item !== "object") return null;
  const e = item as Record<string, unknown>;

  const id = pickString(e.entity_id) ?? pickString(e.id) ?? pickString(e.uuid);
  const name = pickString(e.name) ?? pickString(e.title);
  if (!id || !name) return null;

  const type = pickString(e.type) ?? pickString(e.subtype);

  // Popularity and affinity are distinct Qloo fields — never conflate them.
  const popularity = typeof e.popularity === "number" ? e.popularity : undefined;
  const query =
    e.query && typeof e.query === "object" ? (e.query as Record<string, unknown>) : undefined;
  const affinity =
    typeof query?.affinity === "number"
      ? query.affinity
      : typeof e.affinity === "number"
        ? e.affinity
        : undefined;

  const properties =
    e.properties && typeof e.properties === "object"
      ? (e.properties as Record<string, unknown>)
      : undefined;

  return { id, name, type, popularity, affinity, properties, raw: item };
}

function pickString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function extractTagNames(payload: unknown): string[] {
  const entities = normalizeQlooEntities(payload);
  const tags = new Set<string>();

  for (const entity of entities) {
    const props = entity.properties ?? {};
    const tagLists = [props.tags, props.tag, (entity.raw as Record<string, unknown> | undefined)?.tags];
    for (const list of tagLists) {
      if (!Array.isArray(list)) continue;
      for (const t of list) {
        for (const label of tagLabels(t)) tags.add(label);
      }
    }
  }

  return [...tags];
}

export function normalizeTags(payload: unknown): Array<{ id: string; name: string }> {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  let list: unknown[] = [];
  if (Array.isArray(root.results)) list = root.results;
  else if (root.results && typeof root.results === "object") {
    const tags = (root.results as Record<string, unknown>).tags;
    if (Array.isArray(tags)) list = tags;
  }
  if (Array.isArray(root.tags)) list = root.tags;

  const out: Array<{ id: string; name: string }> = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const t = item as Record<string, unknown>;
    const id = pickString(t.id) ?? pickString(t.tag_id);
    const name = pickString(t.name) ?? pickString(t.title) ?? (id ? humanizeTagId(id) : undefined);
    if (id && name) out.push({ id, name });
  }
  return out;
}

function tagLabels(t: unknown): string[] {
  if (typeof t === "string") {
    return [t.toLowerCase(), humanizeTagId(t)];
  }
  if (t && typeof t === "object") {
    const name = pickString((t as Record<string, unknown>).name);
    const id = pickString((t as Record<string, unknown>).id);
    const labels: string[] = [];
    if (name) labels.push(name.toLowerCase());
    if (id) {
      labels.push(id.toLowerCase());
      labels.push(humanizeTagId(id));
    }
    return labels;
  }
  return [];
}

/** urn:tag:genre:qloo:alternative_rock → alternative rock */
export function humanizeTagId(id: string): string {
  const leaf = id.split(":").pop() ?? id;
  return leaf.replace(/_/g, " ").toLowerCase();
}
