# Live Qloo quality probe (bounded)

**Generated:** see `docs/LIVE_QUALITY.json` (`generatedAt` field)  
**Runner:** `BRAGI_EVAL_BASE=https://bragi-qloo.vercel.app node scripts/live-quality-eval.mjs`  
**Production SHA at capture:** `39ae762` (PR #2)  
**Note:** Metrics are descriptive. Cultural sense requires human review — no invented relevance scores.

## Integrity note (2026-10-30)

Earlier `LIVE_QUALITY.json` was captured **before** the Path B sort fix (total score before Insights-only points). That stale file listed Ferales / Nómada / Siempre Llueve for hip-hop.  

**Re-run against production `39ae762`:** hip-hop tops with **Alcolirykoz** (score 26.5 · Search 16 · Insights 9), then Centro Cultural Moravia, then Ferales. The previous markdown claim was correct for post-fix production; the JSON was stale.

## Profiles (production live re-run)

| Profile | OK | Creators | Geo Medellín | Wall ms | Top matches (human skim) |
| --- | --- | --- | --- | --- | --- |
| alt-rock | yes | 2+ | yes | ~1s | Ferales + DIY peers |
| hip-hop | yes | 2+ | yes | ~3s | **Alcolirykoz** leads (Search-backed) |
| experimental | yes | 1+ | yes | ~14s | Experimental / DIY sound |
| visual | yes | 0 | yes | <1s | Places path |
| indie-art | yes | 0 | yes | ~7s | Mixed places/projects |
| jazz | yes | 1+ | yes | ~10s | Mixed |

## Human review

- **Strength:** Hip-hop → Alcolirykoz is culturally appropriate; alt-rock → Ferales remains sound.  
- **Geography:** Odio a Botero absent; tops stay Medellín.  
- **Limitation:** Insights tag noise can still surface adjacent creators lower in the list (e.g. Ferales under hip-hop as a lower-scoring Insights overlap).  
- **Limitation:** Catalogue is curated and small — diversity ≠ completeness.
