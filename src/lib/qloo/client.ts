import { QlooClientError, type QlooEntity, type QlooEntityType } from "@/lib/types";
import { extractTagNames, normalizeQlooEntities, normalizeTags } from "./normalize";

const DEFAULT_BASE = "https://hackathon.api.qloo.com";
const DEFAULT_TIMEOUT_MS = 45_000;

export interface QlooClientOptions {
  apiKey?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export interface SearchParams {
  query: string;
  types?: QlooEntityType[];
  take?: number;
}

export interface InsightsParams {
  filterType: QlooEntityType;
  signalEntityIds?: string[];
  signalTags?: string[];
  locationQuery?: string;
  take?: number;
  /** When true, request query.explainability metadata */
  explainability?: boolean;
  /** Candidate entity IDs for affinity evaluation (filter.results.entities) */
  resultEntityIds?: string[];
}

export class QlooService {
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: QlooClientOptions = {}) {
    this.apiKey = options.apiKey ?? process.env.QLOO_API_KEY;
    this.baseUrl = (options.baseUrl ?? process.env.QLOO_API_BASE_URL ?? DEFAULT_BASE).replace(
      /\/$/,
      "",
    );
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  hasCredentials(): boolean {
    return Boolean(this.apiKey?.trim());
  }

  async searchEntities(params: SearchParams): Promise<QlooEntity[]> {
    const qs = new URLSearchParams();
    qs.set("query", params.query);
    if (params.types?.length) qs.set("types", params.types.join(","));
    if (params.take) qs.set("take", String(params.take));

    const payload = await this.request(`/search?${qs.toString()}`);
    return normalizeQlooEntities(payload);
  }

  async getInsights(params: InsightsParams): Promise<{
    entities: QlooEntity[];
    tags: string[];
    raw: unknown;
  }> {
    const qs = new URLSearchParams();
    qs.set("filter.type", params.filterType);
    if (params.signalEntityIds?.length) {
      qs.set("signal.interests.entities", params.signalEntityIds.join(","));
    }
    if (params.signalTags?.length) {
      qs.set("signal.interests.tags", params.signalTags.join(","));
    }
    if (params.locationQuery) {
      qs.set("filter.location.query", params.locationQuery);
    }
    if (params.resultEntityIds?.length) {
      qs.set("filter.results.entities", params.resultEntityIds.join(","));
    }
    if (params.explainability) {
      qs.set("feature.explainability", "true");
    }
    if (params.take) qs.set("take", String(params.take));

    const raw = await this.request(`/v2/insights?${qs.toString()}`);
    return {
      entities: normalizeQlooEntities(raw),
      tags: extractTagNames(raw),
      raw,
    };
  }

  /** Search Qloo tags (for genre/theme signals). */
  async searchTags(query: string, take = 5): Promise<Array<{ id: string; name: string }>> {
    const qs = new URLSearchParams();
    qs.set("filter.query", query);
    qs.set("take", String(take));
    qs.set("feature.typo_tolerance", "true");

    const raw = await this.request(`/v2/tags?${qs.toString()}`);
    return normalizeTags(raw);
  }

  /** Minimal connectivity check — one small search. */
  async smokeTest(): Promise<{ ok: true; entityCount: number } | { ok: false; error: QlooClientError }> {
    try {
      const entities = await this.searchEntities({
        query: "Radiohead",
        types: ["urn:entity:artist"],
        take: 1,
      });
      return { ok: true, entityCount: entities.length };
    } catch (err) {
      if (err instanceof QlooClientError) return { ok: false, error: err };
      return {
        ok: false,
        error: new QlooClientError(
          err instanceof Error ? err.message : "Unknown smoke-test failure",
          "UNKNOWN",
        ),
      };
    }
  }

  private async request(pathWithQuery: string): Promise<unknown> {
    if (!this.apiKey?.trim()) {
      throw new QlooClientError(
        "QLOO_API_KEY is not configured. Set it in .env.local or run `qloo setup --qloo`.",
        "MISSING_API_KEY",
      );
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(`${this.baseUrl}${pathWithQuery}`, {
        method: "GET",
        headers: {
          "X-Api-Key": this.apiKey,
          Accept: "application/json",
        },
        signal: controller.signal,
        cache: "no-store",
      });

      if (response.status === 401) {
        throw new QlooClientError(
          "Qloo authentication failed (401). Check key and hackathon base URL.",
          "UNAUTHORIZED",
          401,
        );
      }
      if (response.status === 403) {
        throw new QlooClientError(
          "Qloo forbidden (403). Entity type or parameter may be unsupported for this key.",
          "FORBIDDEN",
          403,
        );
      }
      if (response.status === 429) {
        throw new QlooClientError(
          "Qloo rate limit exceeded (429). Retry later or reduce request volume.",
          "RATE_LIMITED",
          429,
        );
      }
      if (response.status === 404) {
        return { results: [], entities: [] };
      }
      if (!response.ok) {
        throw new QlooClientError(
          `Qloo request failed with status ${response.status}`,
          "BAD_RESPONSE",
          response.status,
        );
      }

      return await response.json();
    } catch (err) {
      if (err instanceof QlooClientError) throw err;
      if (err instanceof Error && err.name === "AbortError") {
        throw new QlooClientError("Qloo request timed out", "TIMEOUT");
      }
      throw new QlooClientError(
        err instanceof Error ? err.message : "Network error calling Qloo",
        "NETWORK",
      );
    } finally {
      clearTimeout(timer);
    }
  }
}

export function createQlooService(options?: QlooClientOptions): QlooService {
  return new QlooService(options);
}
