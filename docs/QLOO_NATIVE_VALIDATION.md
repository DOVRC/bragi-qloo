# Qloo native intelligence — validation notes

**Branch:** `feature/qloo-native-intelligence`  
**Date:** 2026-10-30  
**Host:** `https://hackathon.api.qloo.com` only  

This document separates **fixture tests** from **limited live verification**. It does **not** claim improved recommendation “accuracy” without external relevance judgments.

## Credential note

Production and local `.env.local` still use a `hack_`-prefixed key. Any previously screenshot-exposed key must be treated as compromised until rotated at Qloo and replaced in Vercel Secrets. **Do not merge this branch to production until rotation is confirmed.**

## Endpoints / parameters tested (live, limited)

| Call | Parameters | Result |
| --- | --- | --- |
| `GET /search` | `query=Radiohead`, `types=urn:entity:artist`, `take=1` | 200, entity id present |
| `GET /v2/insights` | `filter.type=urn:entity:artist`, `signal.interests.entities`, `feature.explainability=true`, `take=3` | 200; `query.explainability` present; per-entity explainability present |
| `GET /search` | venue names + `types=urn:entity:place` | Indexed hits for MAMM, Teatro Pablo Tobón, Teatro Metropolitano, Orquideorama |
| `GET /v2/insights` | `filter.type=urn:entity:place`, signals + `filter.results.entities` + `feature.explainability=true` | 200; candidate returned with native affinity + explainability |

## Native explainability

- **Works** on hackathon Insights for artist (and place candidate) requests.
- Shape observed: `query.explainability["signal.interests.entities"]` (map/array of scores).
- Warnings path supported: if Qloo returns `query.explainability.warning`, we surface it and do **not** invent contributions.
- UI labels these as **Qloo explainability (0–1)**, never as Bragi points.

## Qloo-indexed venue coverage

| Catalogue entry | Qloo entity name (Search) | Indexed |
| --- | --- | --- |
| MAMM | Museo de Arte Moderno | Yes |
| Teatro Pablo Tobón Uribe | exact name | Yes |
| Teatro Metropolitano | Medellín José Gutiérrez Gómez | Yes |
| Jardín Botánico | Orquideorama Jardín Botánico | Yes |
| Independent creators / projects | — | **No** (Path B only; never assume Qloo representation) |

Ambiguous Search hits are rejected unless name match is confident. IDs are stored on catalogue rows only after live verification.

## Dual-path ranking

| Path | Mechanism | Provenance |
| --- | --- | --- |
| **A — qloo_native** | Insights `filter.results.entities` (+ explainability) | `rankingPath=qloo_native`, `qlooNativeAffinity` on 0–1 scale |
| **B — bragi_catalogue** | Evidence-aware hook/tag overlap | `rankingPath=bragi_catalogue`, Bragi `score` points |

Merge prefers Path A when present, then fills from Path B. **Scores are never equated across paths.**

## Cross-domain labeling fix

`classifyStrength()` no longer assigns `cross_domain_affinity` from Insights point totals alone. Cross-domain requires `hasTraceableDomainChange(sourceDomains, resultDomain)`. Otherwise Insights-heavy matches use `qloo_backed_affinity`.

## Independent creators / projects added

| Id | Kind | Public source |
| --- | --- | --- |
| `creator-alcolirykoz` | creator | https://alcolirykoz.com/ |
| `creator-odio-a-botero` | creator | https://odioabotero.bandcamp.com/ |
| `project-casa-tres-patios` | project | https://casatrespatios.org/ |
| `project-centro-cultural-moravia` | project | https://centroculturalmoravia.org/ |

No invented prices, contacts, or booking availability. No fabricated Qloo entity IDs for these rows.

## Fixture ablation (offline)

```bash
npm run qloo:ablation
```

Compares `user_only` / `search_only` / `insights_only` / `full` on fixed TasteProfiles. Reports catalogue indexed + creator coverage. Path A is live-only.

## Automated tests

- Domains / cross-domain gate
- Explainability normalizer (present / warning / missing)
- Strength classification regressions
- Local creator without Qloo id
- Empty / overfitted hook cases
- Native/catalogue merge without score conflation

Run: `npm test` · `npm run typecheck` · `npm run lint` · `npm run build`

## Matching quality limitations

- Catalogue hooks remain a Path B signal; overfit risk is reduced by caps + domain gates but not eliminated.
- Place Search names can omit city; IDs were affinity-tested but geocode was not exhaustively audited for every property field.
- Native affinity magnitudes are Qloo’s scale — not calibrated to Bragi points.
- Empty Insights / timeouts fall back to Path B with explicit warnings.

## Release gate

Push feature branch for review. Merge/deploy to production **only after** credential rotation + green CI + browser Taste Journey QA on a preview deployment.
