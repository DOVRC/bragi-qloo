import type {
  CulturalSignal,
  CulturalSignalKind,
  DiscoveryIntent,
  DiscoverRequest,
  QlooEntityType,
} from "@/lib/types";

/** Max signals resolved via Qloo Search per discovery run (request budget). */
export const MAX_RESOLVE_SIGNALS = 5;
/** Max genre/theme tag lookups per discovery run. */
export const MAX_TAG_SIGNALS = 3;

const ENTITY_HINTS: Array<{ pattern: RegExp; type: QlooEntityType }> = [
  {
    pattern: /\b(radiohead|beatles|bjork|miles davis|coltrane|j balvin|bad bunny|shakira)\b/i,
    type: "urn:entity:artist",
  },
  {
    pattern: /\b(spirited away|totoro|inception|movie|film|cinema|anime)\b/i,
    type: "urn:entity:movie",
  },
  { pattern: /\b(breaking bad|ted lasso|tv|series)\b/i, type: "urn:entity:tv_show" },
  { pattern: /\b(nike|apple|patagonia)\b/i, type: "urn:entity:brand" },
  { pattern: /\b(book|novel)\b/i, type: "urn:entity:book" },
];

const GENRE_THEME_RE =
  /\b(experimental jazz|jazz|reggaeton|salsa|latin dance|urban fashion|fashion|hip hop|hip-hop|electronic|ambient|indie|art rock|cumbia|vallenato|dancehall)\b/i;

const BUDGET_RE = /(?:COP|budget|presupuesto)\s*[\$:]?\s*([\d.,]+)/i;
const CITY_RE = /\b(medell[ií]n|bogot[aá]|cali|cartagena)\b/i;

/** Extract cultural signal phrases from free text + optional explicit list. */
export function parseDiscoverInput(input: DiscoverRequest): {
  signals: CulturalSignal[];
  city: string;
  budgetCop?: number;
} {
  const city =
    input.city?.trim() ||
    input.query.match(CITY_RE)?.[1]?.replace(/í/g, "i").replace(/á/g, "a") ||
    "Medellín";

  let budgetCop = input.budgetCop;
  if (budgetCop == null) {
    const m = input.query.match(BUDGET_RE);
    if (m) {
      budgetCop = Number(m[1].replace(/\./g, "").replace(/,/g, ""));
      if (Number.isNaN(budgetCop)) budgetCop = undefined;
    }
  }

  const fromList = (input.signals ?? []).map((s) => s.trim()).filter(Boolean);
  const fromQuery = extractQuotedOrListed(input.query);
  const merged = uniqueStrings([...fromList, ...fromQuery]);

  const signals: CulturalSignal[] = merged.map((raw) => classifySignal(raw));

  return {
    signals,
    city: normalizeCity(city),
    budgetCop,
  };
}

export function classifySignal(raw: string): CulturalSignal {
  const kind: CulturalSignalKind = GENRE_THEME_RE.test(raw)
    ? "genre_or_theme"
    : "named_entity";

  // Studio Ghibli: leave inferredType unset so resolver tries untyped first after optional typed miss.
  if (/\bstudio ghibli\b/i.test(raw)) {
    return { raw, kind: "named_entity", inferredType: undefined };
  }

  if (kind === "genre_or_theme") {
    if (/\b(fashion|nike|urban fashion)\b/i.test(raw)) {
      return { raw, kind, inferredType: "urn:entity:brand" };
    }
    if (/\b(jazz|reggaeton|salsa|hip hop|hip-hop|electronic|cumbia|dance)\b/i.test(raw)) {
      return { raw, kind, inferredType: "urn:entity:artist" };
    }
    return { raw, kind };
  }

  for (const hint of ENTITY_HINTS) {
    if (hint.pattern.test(raw) && hint.type) {
      return { raw, kind, inferredType: hint.type };
    }
  }

  // Unknown named entities: leave type unset so Search runs untyped first.
  // Do not default to music artists — Qloo entity types should come from resolution.
  return { raw, kind };
}

function extractQuotedOrListed(query: string): string[] {
  const results: string[] = [];
  const lovePattern =
    /(?:love|like|into|enjoy|fan of)\s+(.+?)(?:\.|;|help|find|with a budget|$)/i;
  const love = query.match(lovePattern);
  if (love?.[1]) {
    const chunk = love[1]
      .replace(/\band\b/gi, ",")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 1 && s.length < 80);
    results.push(...chunk);
  }

  const quoted = [...query.matchAll(/"([^"]+)"/g)].map((m) => m[1].trim());
  results.push(...quoted);

  return results;
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

function normalizeCity(city: string): string {
  const lower = city.toLowerCase();
  if (lower.includes("medell")) return "Medellín";
  if (lower.includes("bogot")) return "Bogotá";
  return city;
}

export function validateDiscoverRequest(body: unknown): {
  ok: true;
  value: DiscoverRequest;
} | { ok: false; message: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "Request body must be a JSON object." };
  }
  const b = body as Record<string, unknown>;
  const query = typeof b.query === "string" ? b.query.trim() : "";
  const signals = Array.isArray(b.signals)
    ? b.signals.filter((s): s is string => typeof s === "string")
    : undefined;

  if (!query && (!signals || signals.length === 0)) {
    return { ok: false, message: "Provide a query or at least one cultural signal." };
  }

  if (query.length > 2000) {
    return { ok: false, message: "Query is too long (max 2000 characters)." };
  }

  const budgetCop =
    typeof b.budgetCop === "number" && Number.isFinite(b.budgetCop) && b.budgetCop >= 0
      ? b.budgetCop
      : undefined;

  const city = typeof b.city === "string" ? b.city.trim() : undefined;

  const intentRaw = typeof b.intent === "string" ? b.intent.trim().toLowerCase() : undefined;
  const intent: DiscoveryIntent | undefined =
    intentRaw === "creators" || intentRaw === "places" || intentRaw === "mixed"
      ? intentRaw
      : intentRaw === "surprise" || intentRaw === "surprise_me" || intentRaw === "surprise-me"
        ? "mixed"
        : undefined;

  const excludeEntryIds = Array.isArray(b.excludeEntryIds)
    ? b.excludeEntryIds
        .filter((id): id is string => typeof id === "string")
        .map((id) => id.trim())
        .filter((id) => id.length > 0 && id.length < 120)
        .slice(0, 20)
    : undefined;

  const prioritySignals = Array.isArray(b.prioritySignals)
    ? b.prioritySignals
        .filter((s): s is string => typeof s === "string")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s.length < 80)
        .slice(0, MAX_RESOLVE_SIGNALS)
    : undefined;

  return {
    ok: true,
    value: {
      query: query || (signals ?? []).join(", "),
      signals,
      city,
      budgetCop,
      intent,
      excludeEntryIds: excludeEntryIds?.length ? excludeEntryIds : undefined,
      prioritySignals: prioritySignals?.length ? prioritySignals : undefined,
    },
  };
}

/**
 * Prefer explicitly chosen refinement signals within the Search/Tags budget.
 * Does not invent signals — only reorders / truncates the provided list.
 */
export function selectSignalsForResolution(
  signals: CulturalSignal[],
  options: { priorityRaws?: string[]; limit?: number } = {},
): CulturalSignal[] {
  const limit = options.limit ?? MAX_RESOLVE_SIGNALS;
  if (signals.length <= limit && (!options.priorityRaws || options.priorityRaws.length === 0)) {
    return signals;
  }

  const priorityKeys = [
    ...new Set((options.priorityRaws ?? []).map((s) => s.toLowerCase().trim()).filter(Boolean)),
  ];
  const byKey = new Map(signals.map((s) => [s.raw.toLowerCase(), s]));
  const out: CulturalSignal[] = [];
  const seen = new Set<string>();

  for (const key of priorityKeys) {
    const hit = byKey.get(key);
    if (!hit || seen.has(key)) continue;
    seen.add(key);
    out.push(hit);
    if (out.length >= limit) return out;
  }

  for (const signal of signals) {
    const key = signal.raw.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(signal);
    if (out.length >= limit) break;
  }

  return out;
}
