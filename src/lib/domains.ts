import type { CatalogueCategory, QlooEntityType } from "@/lib/types";

/** Coarse cultural domains used to validate “cross-domain” labels. */
export type CulturalDomain =
  | "music"
  | "film"
  | "visual"
  | "brand"
  | "place"
  | "literary"
  | "performance"
  | "other";

export function domainFromQlooType(type?: string | null): CulturalDomain {
  if (!type) return "other";
  const t = type.toLowerCase();
  if (t.includes("artist") || t.includes("podcast")) return "music";
  if (t.includes("movie") || t.includes("tv_show") || t.includes("tv-show")) return "film";
  if (t.includes("brand")) return "brand";
  if (t.includes("place") || t.includes("destination") || t.includes("locality")) return "place";
  if (t.includes("book")) return "literary";
  if (t.includes("person")) return "other";
  return "other";
}

export function domainFromCatalogueCategory(category: CatalogueCategory): CulturalDomain {
  switch (category) {
    case "music":
      return "music";
    case "film":
      return "film";
    case "visual_arts":
    case "craft":
      return "visual";
    case "performance":
      return "performance";
    case "literary":
      return "literary";
    case "experience":
      return "place";
    default:
      return "other";
  }
}

/** True when at least one source domain differs from the result domain (excluding "other"). */
export function hasTraceableDomainChange(
  sourceDomains: CulturalDomain[],
  resultDomain: CulturalDomain,
): boolean {
  if (resultDomain === "other") return false;
  const sources = sourceDomains.filter((d) => d !== "other");
  if (sources.length === 0) return false;
  return sources.some((d) => d !== resultDomain);
}

export function domainsFromSignals(
  signals: Array<{ inferredType?: QlooEntityType; raw: string }>,
  resolvedTypes: Array<string | undefined>,
): CulturalDomain[] {
  const out = new Set<CulturalDomain>();
  for (const t of resolvedTypes) out.add(domainFromQlooType(t));
  for (const s of signals) {
    if (s.inferredType) out.add(domainFromQlooType(s.inferredType));
    const raw = s.raw.toLowerCase();
    if (/\b(jazz|rock|reggaeton|salsa|music|radiohead|bunny|balvin|davis)\b/.test(raw)) {
      out.add("music");
    }
    if (/\b(ghibli|film|movie|anime|cinema)\b/.test(raw)) out.add("film");
    if (/\b(fashion|nike|brand|streetwear)\b/.test(raw)) out.add("brand");
  }
  return [...out];
}
