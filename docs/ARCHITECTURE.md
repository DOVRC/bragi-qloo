# Architecture — Bragi Taste Agent

## Current stack

- **Next.js App Router** at repository root  
- **React + TypeScript + Tailwind**  
- **Server Route Handlers** for Qloo  
- **Static curated catalogue** (`src/data/catalogue.ts`)  
- **No ICP / blockchain / auth / payments**

## Boundaries

```
UI (TasteJourney guided steps)
  → /api/discover | /api/search | /api/health/qloo
      → DiscoveryAgent
          → QlooService (/search, /v2/tags, /v2/insights)
          → CatalogueService (contribution-aware ranking)
          → DiscoveryTrace (sanitized for client visualization)
```

## Services

| Service | Role |
| --- | --- |
| QlooService | Typed HTTP client; errors; smoke test |
| resolveSignalEntity | Name-aware Search resolution |
| DiscoveryAgent | Multi-step conditional tool orchestration + trace |
| CatalogueService | Filters + contribution scoring + evidenceStrength |
| TasteJourney | Guided UI: interests → affinities → places → why |

## Evidence classes

`cross_domain_affinity` · `direct_taste_match` · `catalogue_supported` · `limited_evidence`  
Derived from Search / Insights / user contribution points — see `docs/QLOO_VALUE_VALIDATION.md`.

## Deployment

Vercel project root: `.`  
Secrets: `QLOO_API_KEY`, `QLOO_API_BASE_URL`, `SAMPLE_DATA_MODE=false` (server only)

See [`QLOO_INTEGRATION.md`](QLOO_INTEGRATION.md) and [`DECISIONS.md`](DECISIONS.md).
