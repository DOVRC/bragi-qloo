# Implementation plan

Deadline: **2026-10-30 11:45 PM EDT**. Ordered by dependency and impact.

Status values: `TODO` | `IN PROGRESS` | `DONE` | `BLOCKED`

Live tracker: keep [`STATUS.md`](STATUS.md) in sync when completing work.

---

## P0 — Submission blockers

### P0.1 — Repo audit + branch + durable docs
- **Deps:** none  
- **Files:** `AGENTS.md`, `docs/*`, branch `feature/qloo-taste-agent`  
- **AC:** Baseline SHA recorded; docs linkable; agents can resume from STATUS  
- **Status:** DONE  

### P0.2 — Taste Agent app scaffold
- **Deps:** P0.1  
- **Files:** `apps/taste-agent/**`  
- **AC:** `npm run dev` starts; TypeScript + Tailwind; no ICP deps  
- **Status:** DONE  
- **Evidence:** Next.js 15 app created; production build succeeded 2026-10-30  

### P0.3 — Typed domain models + catalogue
- **Deps:** P0.2  
- **Files:** `src/lib/types.ts`, `src/data/catalogue.ts`  
- **AC:** Catalogue entries typed; sample entries labeled; budget/category filters  
- **Status:** DONE  
- **Evidence:** catalogue + CatalogueService tests pass  

### P0.4 — Server-side Qloo client
- **Deps:** P0.2  
- **Files:** `src/lib/qloo/*`  
- **AC:** search + insights methods; error mapping; fixtures for tests; no key leak  
- **Status:** DONE (live auth still pending)  
- **Evidence:** normalize + mocked client tests; smoke script ready  

### P0.5 — Discovery agent workflow
- **Deps:** P0.3, P0.4  
- **Files:** `src/lib/agent/*`, `src/app/api/discover/route.ts`  
- **AC:** Multi-step pipeline; step log; ≤3 recs; failures surface (no silent fake)  
- **Status:** DONE  
- **Evidence:** discovery.test.ts — mocked live + missing key + sample mode  

### P0.6 — Core UI journey
- **Deps:** P0.5  
- **Files:** `src/app/**`, components  
- **AC:** Preference input → loading/steps → results/errors; Bragi branding; responsive  
- **Status:** DONE  
- **Evidence:** page + DiscoveryForm + AgentSteps + RecommendationList; build includes `/`  

### P0.7 — Tests + production build
- **Deps:** P0.3–P0.6  
- **AC:** typecheck, lint, build, unit tests for validation/normalize/match pass  
- **Status:** DONE  
- **Evidence:** 11 tests pass; lint clean; `next build` exit 0  

### P0.8 — Live Qloo smoke (credentials)
- **Deps:** P0.4 + user-configured key  
- **AC:** One real `/search` succeeds; documented in STATUS  
- **Status:** DONE  
- **Evidence:** `qloo:smoke` OK; live e2e A/B differentiated; `/api/health/qloo` + `/api/discover` mode=live (2026-10-30)  

### P0.9 — Public deploy + LICENSE + Devpost materials
- **Deps:** P0.7, P0.8 preferred; user authorization to push/deploy  
- **AC:** Public demo URL; license detectable; English description; setup docs  
- **Status:** BLOCKED (no push/deploy auth; LICENSE ownership TBD)  

---

## P1 — Competitive improvements

| ID | Task | Status |
| --- | --- | --- |
| P1.1 | Stronger cross-domain Insights (multiple filter.types) | TODO |
| P1.2 | Evidence UI: show Qloo entities/tags used | TODO |
| P1.3 | Refinement actions (budget, category, vibe) | TODO |
| P1.4 | Polish motion, mobile layout, empty states | TODO |
| P1.5 | Real Medellín catalogue expansion (verified public sources) | TODO |
| P1.6 | End-to-end reliability (timeouts, partial success) | TODO |

---

## P2 — Optional

| ID | Task | Status |
| --- | --- | --- |
| P2.1 | Additional cities | TODO |
| P2.2 | User accounts / history | TODO |
| P2.3 | LLM narrative layer (only with Qloo evidence) | TODO |
| P2.4 | Persistence (DB) | TODO |

---

## Immediate next (after this session)

1. Configure `QLOO_API_KEY` locally via `qloo setup --qloo` or `.env.local` → run `npm run qloo:smoke`.
2. Authorize push of `feature/qloo-taste-agent` and Vercel deploy.
3. Confirm open-source license choice with repo owners → add `LICENSE`.
4. Complete P1 evidence UI + catalogue verification.
