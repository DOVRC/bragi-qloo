# Qloo native intelligence — validation notes

**Branch:** `feature/qloo-native-intelligence`  
**Updated:** 2026-10-30 (intent-aware matchmaking)  
**Host:** `https://hackathon.api.qloo.com` only  

Fixture tests ≠ live verification. No accuracy claims without external judgments.

## Credential gate

Local/production still use a `hack_`-prefixed key. Treat any screenshot-exposed key as **compromised until rotated**. **Do not merge to main / redeploy production until rotation is confirmed** and the Vercel Secret is updated.

## Verified Insights response fields (live)

| Field | Location | Role |
| --- | --- | --- |
| `popularity` | entity root | Global popularity percentile — **not** contextual affinity |
| `query.affinity` | entity.`query` | Contextual affinity toward input signals |
| `query.explainability` | per entity | Candidate-specific contribution scores |
| `query.explainability` | response top-level | Aggregate influence across the result set |

Live check (Radiohead → place candidates): popularity ≈ 0.99 while `query.affinity` ≈ 0.74–0.80 for the same entities — **values disagree**, confirming they must not be conflated.

## Ranking field used

Path A sorts by **`query.affinity`** when present.  
If affinity is missing, the candidate may still be retained but **no numeric native score is advertised** and popularity is **not** used as a substitute sort key.

## Explainability attribution

| Type | Source | UI |
| --- | --- | --- |
| `CandidateExplainability` | entity.`query.explainability` | Why card contributions |
| `AggregateExplainability` | top-level `query.explainability` | Labeled as overall set only |

Warning-only explainability objects are **not** treated as successful evidence. Aggregate contributions are never copied onto a card as if they were candidate-specific.

## Candidate identity verification

| Catalogue entry | Qloo id status | Notes |
| --- | --- | --- |
| Teatro Pablo Tobón Uribe | **Indexed** (`732F24F4-…`) | Medellín address verified |
| Teatro Metropolitano | **Indexed** (`601A61CD-…`) | Medellín address verified |
| MAMM | **Not indexed** | Prior Search hit was Mexico City’s Museo de Arte Moderno |
| Jardín Botánico programming | **Not indexed** | Orquideorama Qloo record is a structure, not the full garden program |

Creators/projects remain Path B only (no fabricated Qloo IDs).

## Dual-path ranking

| Path | Mechanism | Provenance |
| --- | --- | --- |
| A — `qloo_native` | `filter.results.entities` + `feature.explainability` | `query.affinity` when present |
| B — `bragi_catalogue` | Evidence-aware hooks/tags | Bragi point score |

**Merge rules (intent-aware):** native affinity and Bragi scores are never equated. Path A does not monopolize all top-3 slots when complementary Path B creators/projects exist. Intents: `creators` | `places` | `mixed` (Surprise me).

**Affinity UI highlight:** `matchedAffinityIds` are evidence-backed (candidate explainability inputs + hook-overlapping Insights affinities/tags). The candidate’s own Qloo entity id is **not** treated as an exploratory affinity.

**Live catalogue honesty:** demonstration profiles are never injected when live verified matches are empty.

## Performance

- Overall discovery deadline: **50s** (under Vercel 60s `maxDuration`).
- Search resolves: chunks of 2, **12s** timeout; Tags **10s**; exploratory Insights max 2 concurrent, **~16s**; native Path A **~18s**.
- Instance-scoped GET memoization avoids duplicate identical Qloo paths within one agent run.
- Live Path A probe for 4 candidates: ~**194ms** once Search resolved (hackathon variance still applies).
- Route `maxDuration` remains 60s; sequential 45s×N calls avoided.

## Fixture ablation

```bash
npm run qloo:ablation
```

## Automated tests

45 unit tests including: affinity≠popularity, missing affinity, candidate vs aggregate explainability, warning-only, native sort order, timeout → empty native + catalogue merge fallback, cross-domain gate, creator without Qloo id.

## Release gate

Push → PR → Vercel preview QA → rotate credential → merge only if CI + identity + affinity/explainability gates pass.
