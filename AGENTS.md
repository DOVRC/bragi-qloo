# AGENTS.md — Bragi Taste Agent

Authoritative instructions for Cursor agents and coding assistants working on this repository.

**Before every development task:** read this file, then [`docs/STATUS.md`](docs/STATUS.md), then the relevant docs under [`docs/`](docs/). Inspect current code before changing anything. Implement the smallest coherent improvement. Run relevant tests. Update status/docs. Report completed work, pending items, and blockers. Never mark untested features as complete.

---

## Project identity

| Field | Value |
| --- | --- |
| **Name** | Bragi Taste Agent |
| **Purpose** | AI-powered cultural discovery: match users’ cultural preferences to independent artists and local creative experiences via Qloo Taste Intelligence. |
| **Hackathon** | [Qloo Agentic Hackathon 2026](https://qloo.devpost.com/) |
| **Deadline** | October 30, 2026, 11:45 PM EDT (10:45 PM Colombia) |
| **Team** | Daniel Ossa Velásquez, Yulian Bedoya (Colombia) |
| **Demo market** | Medellín, Colombia |
| **Audience** | People seeking local cultural experiences; independent artists needing culturally matched discovery |
| **Core problem** | Local artists lack visibility; generic recommenders ignore cultural taste DNA |
| **Value proposition** | Qloo-grounded cross-domain affinities → justified local catalogue matches (not LLM guesswork) |
| **Repo** | https://github.com/ybedoyab/Bragi |

### MVP definition

One demonstrable journey: user states cultural signals + Medellín constraints → agent resolves Qloo entities → fetches Insights affinities → matches curated local catalogue → returns ≤3 evidence-based recommendations with explanations and refinement actions.

**We are building:** an agentic cultural matching experience where Qloo evidence genuinely drives recommendations.

**We are not building:** a generic chatbot, travel recommender, popularity list, static AI explanations, superficial Qloo wrapper, marketplace, wallet, or blockchain rebuild.

---

## Repository layout (actual)

```
Bragi/
├── AGENTS.md                 # This file
├── docs/                     # Durable project context (see links below)
├── apps/
│   └── taste-agent/          # NEW: Next.js Taste Agent MVP (hackathon submission target)
├── src/
│   ├── usuarios_backend/     # LEGACY: Azle/ICP canister (user CRUD) — leave intact
│   └── usuarios_frontend/    # LEGACY: Vite/React ICP frontend — leave intact
├── dfx.json                  # LEGACY: Internet Computer config
├── package.json              # LEGACY: npm workspaces for ICP apps
└── README.md                 # Root readme (update for submission when ready)
```

**Baseline (pre-hackathon):** commit `29c39af7805833e87d215602ee769d654f9f0715` on `main`.  
**Active branch:** `feature/qloo-taste-agent`

### Existing vs proposed

| Area | Status |
| --- | --- |
| ICP canisters, Internet Identity, Azle backend | **Existing — do not modify for MVP** |
| Legacy Vite frontend + Bootstrap | **Existing — reuse branding assets only** |
| `apps/taste-agent` Next.js App Router | **New MVP** |
| Server-side Qloo adapter | **New** |
| Discovery agent workflow | **New** |
| Medellín curated catalogue | **New** |

---

## Architecture (MVP)

- **Frontend:** Next.js App Router, React, TypeScript, Tailwind CSS — preference input, agent progress, recommendations, errors.
- **Backend boundary:** Next.js Route Handlers only. Qloo credentials never reach the browser.
- **Qloo boundary:** `QlooService` → `GET https://hackathon.api.qloo.com` with `X-Api-Key`. Primary endpoints: `/search`, `/v2/insights`. Do not use `/recs` or `/recommendations`.
- **Agentic workflow:** deterministic multi-step orchestrator (`DiscoveryAgent`) with tool calls: interpret → search entities → insights → preference profile → catalogue match → rank → explain.
- **Catalogue:** typed static JSON/TS data under `apps/taste-agent/src/data/`. Label demo/sample entries clearly.
- **Auth:** none required for public demo.
- **Deploy target:** Vercel (not deployed without explicit authorization).

Detailed diagrams and service contracts: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).  
Qloo contracts: [`docs/QLOO_INTEGRATION.md`](docs/QLOO_INTEGRATION.md).

### Environment

| Variable | Where | Notes |
| --- | --- | --- |
| `QLOO_API_KEY` | server only | Event-issued key. Never commit. Rotate if previously exposed. |
| `QLOO_API_BASE_URL` | server | Default `https://hackathon.api.qloo.com` |
| `SAMPLE_DATA_MODE` | optional | `true` only for UI development; UI must show a visible sample-data banner |

Copy from `apps/taste-agent/.env.example`. Setup credentials via official interactive process: `qloo setup --qloo` (never pass keys as CLI args or into AI prompts).

### Commands (taste-agent)

```bash
cd apps/taste-agent
npm install
npm run dev          # local development
npm run build        # production build
npm run lint
npm run typecheck
npm test             # unit/integration with fixtures
```

Legacy ICP: see root `README.md` / `dfx` — not required for the Taste Agent MVP.

---

## Engineering rules

1. **TypeScript** for all new application code.
2. Prefer modular, typed interfaces; small testable changes.
3. Keep **Qloo calls server-side**; validate inputs and responses.
4. Handle timeouts, 401/403/429, and empty results explicitly.
5. Avoid unnecessary dependencies and overengineering.
6. **Never expose secrets.** Never log API keys or sensitive headers.
7. **Never present mock recommendations as live Qloo results.** Sample mode must be visibly labeled.
8. **Do not fabricate** API endpoints, entity IDs, response shapes, artist contacts, prices, or booking links.
9. **Do not silently fall back** to fake data when a live request fails — surface the error.
10. Prefer real, publicly verifiable catalogue entries; label demonstration data.
11. Do not rebuild ICP/blockchain unless a verified requirement appears.
12. Do not push, force-push, deploy, or create remotes without explicit user authorization.
13. Follow existing brand colors/assets when touching UI: slate `#101828` / `#1D2939`, periwinkle `#C7CEEB`, light `#F0F2FA`.

---

## Agent task loop

1. Read `AGENTS.md` and `docs/STATUS.md`.
2. Read relevant docs (`ARCHITECTURE`, `QLOO_INTEGRATION`, `IMPLEMENTATION_PLAN`, `DECISIONS`).
3. Inspect code before proposing changes.
4. Implement the smallest coherent improvement (prefer P0 → P1 → P2).
5. Run relevant tests / typecheck / build as appropriate.
6. Update `docs/STATUS.md` and affected docs.
7. Report: done / pending / blockers.

---

## Related docs

- [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md) — vision, audience, differentiator  
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system design  
- [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) — P0/P1/P2 tasks  
- [`docs/STATUS.md`](docs/STATUS.md) — resume checkpoint  
- [`docs/QLOO_INTEGRATION.md`](docs/QLOO_INTEGRATION.md) — verified API contracts  
- [`docs/HACKATHON_REQUIREMENTS.md`](docs/HACKATHON_REQUIREMENTS.md) — official rules mapping  
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — ADRs  
- [`docs/SUBMISSION_CHECKLIST.md`](docs/SUBMISSION_CHECKLIST.md) — Devpost readiness  
