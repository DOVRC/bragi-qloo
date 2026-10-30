# Architecture — Bragi Taste Agent

## Current stack

- **Next.js App Router** at repository root  
- **React + TypeScript + Tailwind**  
- **Server Route Handlers** for Qloo  
- **Static curated catalogue** (`src/data/catalogue.ts`)  
- **No ICP / blockchain / auth / payments**

## Boundaries

```
UI components
  → /api/discover | /api/search | /api/health/qloo
      → DiscoveryAgent
          → QlooService (/search, /v2/tags, /v2/insights)
          → CatalogueService (ranking + evidence threshold)
```

## Services

| Service | Role |
| --- | --- |
| QlooService | Typed HTTP client; errors; smoke test |
| resolveSignalEntity | Name-aware Search resolution |
| DiscoveryAgent | Multi-step conditional tool orchestration |
| CatalogueService | Filters + transparent scoring |

## Deployment

Vercel project root: `.`  
Secrets: `QLOO_API_KEY`, `QLOO_API_BASE_URL`, `SAMPLE_DATA_MODE=false` (server only)

See [`QLOO_INTEGRATION.md`](QLOO_INTEGRATION.md) and [`DECISIONS.md`](DECISIONS.md).
