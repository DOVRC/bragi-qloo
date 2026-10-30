# Qloo value validation (offline ablation)

**Date:** 2026-10-30  
**Method:** Same Medellín catalogue + synthetic TasteProfiles; no live Qloo calls.  
**Command:** `npm run qloo:ablation`

Modes (`CatalogueService.match` `mode` option):

| Mode | Inputs used |
| --- | --- |
| `user_only` | Raw preference strings vs catalogue hooks |
| `search_only` | Resolved Qloo Search entities |
| `insights_only` | Insights affinity entities + tags (excluding restated inputs) |
| `full` | All contributions (production ranking) |

## Art-house fixture

Signals: Radiohead, Studio Ghibli, experimental jazz  
Resolved: Radiohead, Studio Ghibli  
Insights entities: Portishead, Beck  
Tags: alternative rock, cinematic, ambient rock

Observed (local run):

- `user_only` → **no** recommendations above threshold (keyword-only capped below Search/Insights).
- `search_only` → demo-atelier-norte, MAMM, Teatro Pablo Tobón (direct taste).
- `insights_only` → demo-atelier-norte, Teatro Pablo Tobón (**cross_domain_affinity**).
- `full` → Insights-backed venues ranked first; Casa de la Música appears with mixed Search + weak Insights.

**Conclusion:** Insights and Search change ranking vs user-string-only. Full mode is not identical to either ablation alone.

## Urban fixture

Signals: reggaeton, urban fashion, latin dance  
Resolved: Bad Bunny · Insights: J Balvin

Observed:

- `user_only` → Teatro Metropolitano, Comuna 13 (**limited_evidence**).
- `search_only` → demo-ritmo-barrio.
- `insights_only` → demo-ritmo-barrio (**cross_domain_affinity**).
- `full` → demo-ritmo-barrio first; Comuna 13 / Metropolitano as catalogue-supported.

Art-house vs urban **full** place sets **differ**.

## Interpretation (honest)

- Qloo-derived Search/Insights contributions **do** alter which catalogue entries clear the threshold and how they rank.
- Catalogue `culturalHooks` remain an application-layer bridge; overfitted hooks can amplify lexical matches — mitigated by:
  - Capped user-signal points.
  - Skipping Insights entities/tags that merely restate user/resolved names.
  - Explicit `evidenceStrength` labels on each recommendation.
- This is **not** a claim that Qloo “outperforms” an external baseline model — only that within Bragi, Insights/Search evidence is consequential for ranking when present.

## Live confirmation

Use `npm run qloo:e2e` with a **rotated** server-side key. Compare art-house vs urban journeys in the Taste Journey UI (step 2 affinities + step 3 places). Do not treat a single live run as statistical proof.
