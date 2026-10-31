# Live Qloo quality probe (bounded)

**Generated:** see `docs/LIVE_QUALITY.json`  
**Runner:** `node --env-file=.env.local scripts/live-quality-eval.mjs`  
**Note:** Metrics are descriptive. Cultural sense requires human review — no invented relevance scores.

## Profiles (2026-10-30 local live run)

| Profile | OK | Creators | Geo Medellín | Wall ms | Top matches (human skim) |
| --- | --- | --- | --- | --- | --- |
| alt-rock | yes | 1+ | yes | ~3s | Ferales (correct Medellín alt-rock) |
| hip-hop | yes | 2+ | yes | ~4s | After sort fix: Alcolirykoz leads |
| experimental | yes | 1+ | yes | ~15s | tapelooplab / DIY experimental |
| visual | yes | 0 | yes | <1s | Places path (MAMM-oriented) |
| indie-art | yes | 0 | yes | ~14s | Mixed places/projects |
| jazz | yes | 0 | yes | ~9s | Venue-leaning |

## Human review

- **Strength:** Local creators demo surfaces Ferales + DIY label/project with truthful provenance.  
- **Geography:** Odio a Botero removed; all live tops stayed Medellín.  
- **Limitation:** Insights tag noise can still pull adjacent genres; generic tags (`independent`, `indie`) are filtered.  
- **Limitation:** Catalogue is curated and small — diversity ≠ completeness.
