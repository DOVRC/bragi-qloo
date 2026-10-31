# Qloo integration — verified contracts

Sources investigated (2026-10-30):

- https://docs.qloo.com/reference/qloo-llm-hackathon-developer-guide
- https://docs.qloo.com/reference/get-search
- https://docs.qloo.com/reference/get-tags
- https://github.com/qloo/qloo-hackathon-kit (+ `docs/API_ACCESS.md`, `docs/SUBMISSION.md`)
- https://github.com/qloo/docs-public (recipes, OpenAPI)
- https://docs.qloo.com/docs/cross-category-insights
- https://docs.qloo.com/mcp (docs reference MCP — not an API execution surface)

## Authentication

| Item | Verified value |
| --- | --- |
| Header | `X-Api-Key: <key>` (not Bearer, not query param) |
| Hackathon base URL | `https://hackathon.api.qloo.com` |
| Live auth (Phase 2) | **Succeeded** against hackathon host (smoke + health + discover) |

Credential setup (interactive, never via CLI arg or AI prompt):

```sh
npm install --global @qloo/qloo-harness   # requires Node ≥ 22.19; harness ≥ 0.1.26
qloo setup --qloo
```

Or set `QLOO_API_KEY` in `.env.local` at repository root (gitignored).  
Use `npm run qloo:check-env` to confirm presence without printing secrets.  
Treat any previously screenshot-exposed key as compromised until rotated.

## Client-visible discovery payload

`POST /api/discover` success includes a sanitized `trace` (`DiscoveryTrace`):
user signals, resolved Search entities, Insights affinities (excluding restated inputs),
theme tags, evidence coverage counts, and recommendation ids — **not** raw Qloo payloads.

## Supported harness surfaces

| Surface | Purpose | Production note |
| --- | --- | --- |
| `qloo explore` | Chat exploration | Needs model provider; not for Vercel serverless |
| `qloo exec` / `qloo api` | Scripted / raw API | Local prototyping |
| `qloo mcp` | MCP tool server | Local process |
| Docs MCP `https://docs.qloo.com/mcp` | Documentation only | No credential; do not use `execute-request` |

**Unsupported for hackathon:** harness modes `integrate`, `plan`, `build`.

**Production preference:** typed server-side REST adapter in this repo (`src/lib/qloo/client.ts`).

## Primary endpoints (live-verified)

### `GET /search`

| Param | Notes |
| --- | --- |
| `query` | Required search text |
| `types` | Optional. **Caution:** constraining types can return noisy non-matches (verified: `Studio Ghibli` + `movie`/`brand` returned unrelated “Studio …” entities). Prefer untyped search + **name-match selection**, with typed search as a first attempt only when confident. |
| `take` | Limit |

**Observed shape (sanitized):** `{ success, results: [ { entity_id|id, name, popularity, … } ] }`  
Search hits often omit a useful `type` field (`null` in our normalizer). Insights entities may show `type: "urn:entity"`.

404 → treat as empty results.

### `GET /v2/insights`

GET with query params only.

| Param | Notes |
| --- | --- |
| `filter.type` | Required. Live-tested: `artist`, `movie`, `brand`, `place` |
| `signal.interests.entities` | Entity IDs from `/search` |
| `signal.interests.tags` | Tag IDs from `/v2/tags` |
| `filter.location.query` | e.g. `Medellín` for places |
| `take` | Keep small (5) — latency can exceed 15s on hackathon API |

**Observed shape:** `{ success, results: { entities: [...] }, query? }`  
Entities include names + popularity; tags nest under properties (`name` + `urn:tag:…` ids). Place insights for Medellín return real places but are **not** a substitute for our independent artist catalogue — used as weak/cross signals only.

**Do not use** `/recommendations` or `/recs`.

### `GET /v2/tags`

| Param | Notes |
| --- | --- |
| `filter.query` | Genre/theme string |
| `take` | ≤ 50 |
| `feature.typo_tolerance` | Useful for genre spelling variants |

**Observed shape:** `{ success, results: { tags: [{ id, name }] } }`

## Bragi usage pattern (live)

1. Parse signals → `named_entity` vs `genre_or_theme`.
2. Resolve via Search with name-match + typed→untyped fallback (`resolve.ts`).
3. Resolve genre tags via `/v2/tags` when needed.
4. **Conditional** Insights plan (`planInsights`) — not a fixed always-on triple.
5. Prioritize/caps tags (amenity noise from place Insights).
6. Match Medellín catalogue (application layer) with evidence threshold; prefer verified entries in live mode.
7. Never silent-sample on Qloo failure; Insights TIMEOUT continues with partial Search evidence when available.

## Live verification status

| Check | Status |
| --- | --- |
| Docs reviewed | Done |
| Auth smoke `/search` | **Succeeded** |
| Insights artist/movie/brand/place | **Succeeded** (place usable but noisy for creatives) |
| Tags search | **Succeeded** |
| Full discover e2e A/B | **Succeeded** — differentiated rec sets |
| HTTP `/api/health/qloo` + `/api/discover` | **Succeeded** (`mode: live`) |

## Limitations

- Medellín place Insights ≠ local independent artist inventory.
- Typed Search filters can degrade precision for some names (Ghibli).
- Insights latency/timeouts occur; client timeout is 45s; agent continues with partial evidence.
- Catalogue matching (Path B) is application-derived overlap against Qloo names/tags.
- Path A (when catalogue rows carry verified Qloo entity IDs) uses Insights `filter.results.entities` + optional `feature.explainability` — see [`QLOO_NATIVE_VALIDATION.md`](QLOO_NATIVE_VALIDATION.md).
- Qloo affinities are **aggregate** taste correlations, not proof of an individual’s preferences.
- `cross_domain_affinity` requires a traceable domain change; otherwise use `qloo_backed_affinity`.

## Caching & compliance

Private server-side cache OK. Do not commit Qloo response dumps or API keys.
