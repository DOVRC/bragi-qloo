# Project status — resume checkpoint

**Last updated:** 2026-10-30 (prioritySignals feedback → Qloo resolve budget)  
**Active branch:** `feature/qloo-native-intelligence`  
**Tip:** `ba2ade0` (`fix: prioritize refinement signals within Qloo resolve budget`)  
**Target remote:** https://github.com/DOVRC/bragi-qloo  

## Sprint audit (Final Hackathon Sprint)

| # | Goal | Status |
| --- | --- | --- |
| 1 | Intent-aware ranking (Creators / Places / Surprise me) | **COMPLETE** |
| 2 | Evidence-aware native + catalogue selection | **COMPLETE** |
| 3 | Affinity → recommendation highlighting | **COMPLETE** |
| 4 | Verified independent creators | **COMPLETE** |
| 5 | Adaptive Qloo planning | **COMPLETE** |
| 6 | More like this / Not my style / Surprise me | **COMPLETE** — `prioritySignals` ensures refinements enter the 5-signal Search budget; Surprise rotates affinities |
| 7 | Taste DNA from real Qloo evidence | **COMPLETE** (this delta) |
| 8 | Native affinity comparison | **COMPLETE** when ≥2 native affinities (optional UI) |
| 9 | Reliable discovery under Vercel limits | **COMPLETE** (50s deadline) |
| 10 | Responsive browser E2E | **PARTIAL** — local live E2E verified; preview lacks Qloo key |
| 11 | Screenshots + Devpost materials | **COMPLETE** — `docs/DEVPOST.md` + `docs/screenshots/` |
| 12 | Production deployment readiness | **PARTIAL** — blocked on credential rotation |

## Production (main — untouched)

| Item | Value |
| --- | --- |
| URL | https://bragi-qloo.vercel.app |
| SHA | `149f1b9` |
| `QLOO_API_KEY` | Present on Production Secret only; local key still `hack_`-prefixed → **merge blocked** |

## PR

https://github.com/DOVRC/bragi-qloo/pull/1  

Latest preview (after push): check Vercel for `feature/qloo-native-intelligence`.  
Preview env: **no** `QLOO_API_KEY` listed — Explore fails honestly until Preview Secret is added.

## Remaining before merge

1. Rotate Qloo API key (stop using exposed `hack_` key)  
2. Set rotated key on Vercel **Production + Preview**  
3. Live Taste Journey QA on Preview  
4. Merge PR #1 via GitHub (no force-push)  
