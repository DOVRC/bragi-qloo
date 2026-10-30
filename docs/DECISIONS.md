# Architecture decisions

## ADR-001 — Standalone Next.js app (originally under `apps/taste-agent/`)

- **Date:** 2026-10-30  
- **Status:** Superseded by ADR-010  
- **Context:** Legacy stack is ICP (DFX, Azle, Podman, Internet Identity). Hackathon needs a public web demo with server-side Qloo.  
- **Decision:** New Next.js App Router app; leave `src/usuarios_*` intact initially.  
- **Consequences:** Dual trees until final cleanup.

## ADR-010 — Promote Next.js to repository root; remove ICP

- **Date:** 2026-10-30  
- **Status:** Accepted  
- **Context:** Nested `apps/taste-agent` complicated Vercel and judging; ICP code is out of scope.  
- **Decision:** Move Taste Agent to repo root; delete DFX/Azle/usuarios_* from tracked tree (history retained). Target remote `DOVRC/bragi-qloo`.  
- **Consequences:** Single package.json; deploy root `.`; legacy only in git history.

## ADR-002 — Direct REST Qloo client (not harness in production)

- **Date:** 2026-10-30  
- **Status:** Accepted  
- **Context:** `@qloo/qloo-harness` supports explore/exec/api/mcp; not designed as Vercel serverless dependency.  
- **Decision:** Typed `fetch` adapter against `hackathon.api.qloo.com`. Harness optional for local discovery.  
- **Consequences:** We own request/response normalization; document harness separately.

## ADR-003 — Deterministic multi-step agent (not multi-agent swarm)

- **Date:** 2026-10-30  
- **Status:** Accepted  
- **Context:** Rules require an agentic tool/framework/integration. Deadline is tight.  
- **Decision:** Single `DiscoveryAgent` orchestrator with explicit steps and Qloo tool calls. Optional LLM narrative later only if it cites Qloo evidence.  
- **Consequences:** Meets agentic requirement without orchestration framework risk.

## ADR-004 — Static curated catalogue (no Supabase)

- **Date:** 2026-10-30  
- **Status:** Accepted  
- **Context:** Qloo does not inventory Medellín independents; demo needs local matches.  
- **Decision:** Typed static catalogue; label demo data; match via application layer using Qloo affinities as signals.  
- **Consequences:** Clear provenance; no DB ops before deadline.

## ADR-005 — No mandatory auth for demo

- **Date:** 2026-10-30  
- **Status:** Accepted  
- **Context:** Judges need frictionless public access.  
- **Decision:** No login for MVP.  
- **Consequences:** Rate-limit API route if abused; still keep Qloo key server-side.

## ADR-006 — License deferred pending ownership

- **Date:** 2026-10-30  
- **Status:** Pending  
- **Context:** Baseline repo has no LICENSE; rules require detectable open-source license.  
- **Decision:** Recommend MIT after owners confirm no third-party restrictions; do not add unilaterally if unclear.  
- **Consequences:** Submission blocker until resolved.

## ADR-007 — Name-match Search resolution over blind typed filters

- **Date:** 2026-10-30  
- **Status:** Accepted  
- **Context:** Live `Studio Ghibli` + `types=movie|brand` returned unrelated “Studio …” entities; untyped search returned the correct entity.  
- **Decision:** Resolve with optional typed attempt, then untyped fallback; accept only candidates above a name-match score.  
- **Consequences:** Fewer false entity IDs fed into Insights.

## ADR-008 — Conditional Insights + partial timeout recovery

- **Date:** 2026-10-30  
- **Status:** Accepted  
- **Context:** Fixed always-on Insights triples were slow; hackathon Insights can exceed 15s.  
- **Decision:** `planInsights` selects filter types from signal kinds; TIMEOUT/FORBIDDEN skips that attempt; continue with Search/tags evidence when possible — never sample-mode fallback.  
- **Consequences:** More resilient live demos; UI may show warnings when Insights are partial.

## ADR-009 — Live catalogue prefers verified entries

- **Date:** 2026-10-30  
- **Status:** Accepted  
- **Context:** Demonstration profiles can outscore verified venues on hook density.  
- **Decision:** Live matching excludes demonstration first; only if empty, allow demo with an explicit warning.  
- **Consequences:** Stronger honesty for judges; demo still available for sparse matches.
