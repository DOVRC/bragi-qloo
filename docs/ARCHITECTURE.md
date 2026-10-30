# Architecture — Bragi Taste Agent

Distinguishes **existing** legacy ICP code from the **new** Taste Agent MVP.

## Legacy (untouched for MVP)

| Component | Path | Role |
| --- | --- | --- |
| Azle canister | `src/usuarios_backend` | User CRUD on ICP |
| Vite React app | `src/usuarios_frontend` | Bootstrap UI + Internet Identity |
| DFX config | `dfx.json` | Canister definitions |

**Reusable:** brand name, logos under `src/usuarios_frontend/public/`, color language (`#101828`, `#1D2939`, `#C7CEEB`, `#F0F2FA`), Medellín/artist problem framing.

**Obsolete for MVP:** blockchain payments, Internet Identity gate, canister user CRUD, Podman/DFX as runtime for the demo.

## New MVP (`apps/taste-agent`)

```
Browser (React UI)
    │  POST /api/discover
    ▼
Route Handler (server)
    │
    ├─► DiscoveryAgent (orchestrator)
    │       ├─ interpret request
    │       ├─ QlooService.searchEntities
    │       ├─ QlooService.getInsights
    │       ├─ TasteProfileService.build
    │       ├─ CatalogueService.search/filter
    │       └─ rank + explain
    │
    └─► JSON response (recommendations + evidence + steps)
```

### Services

| Service | Responsibility |
| --- | --- |
| **QlooService** | Server-side HTTP client: `/search`, `/v2/insights`; normalize entities; map errors (401/403/429/timeout) |
| **TasteProfileService** | Map resolved entities + tags into a structured preference profile with source attribution |
| **CatalogueService** | Load curated Medellín entries; filter by location, category, budget; flag sample vs verified |
| **DiscoveryAgent** | Multi-step workflow; emits step log for UI; never invents Qloo evidence |

### Data

- Catalogue: `apps/taste-agent/src/data/catalogue.ts` (typed).
- Qloo fixtures for tests: `apps/taste-agent/src/lib/qloo/__fixtures__/`.

### Security

- `QLOO_API_KEY` only on server.
- No credential in client bundles, docs, or git.
- Validate and sanitize free-text user input before logging or forwarding.

### Deployment

- Target: Vercel (Next.js).
- Do not deploy without explicit authorization.
- Env vars set in host dashboard, not in repo.

See also: [`QLOO_INTEGRATION.md`](QLOO_INTEGRATION.md), [`DECISIONS.md`](DECISIONS.md).
