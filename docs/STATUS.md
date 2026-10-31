# Project status — resume checkpoint

**Last updated:** 2026-10-30 (evidence integrity — LIVE_QUALITY + Qloo delta)  
**Active branch:** `main` (PR #2 merged; integrity follow-up PR if needed)  
**Production SHA:** `39ae762` (pending integrity follow-up SHA after merge)  
**Target remote:** https://github.com/DOVRC/bragi-qloo  

## Production

| Item | Value |
| --- | --- |
| URL | https://bragi-qloo.vercel.app |
| Merge | PR #1 + PR #2 on `main` |
| `QLOO_API_KEY` | Secret on Preview + Production (server-side) |

## Evidence integrity

1. `docs/LIVE_QUALITY.json` regenerated against production — hip-hop → Alcolirykoz (stale pre-sort JSON replaced).  
2. `computeQlooDelta` uses the same Path B constraints as discovery (intent kinds, city, budget, exclusions, `MIN_MATCH_SCORE`) and separates Qloo Path B evidence from native UI merge effects.

## Remaining (post-hackathon)

Rotate temporary Qloo hackathon key; expand verified catalogue carefully.
