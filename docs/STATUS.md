# Project status — resume checkpoint

**Last updated:** 2026-10-30 (native ranking QA hardening)  
**Active branch:** `feature/qloo-native-intelligence`  
**Target remote:** https://github.com/DOVRC/bragi-qloo  

## Production (main — untouched)

| Item | Value |
| --- | --- |
| URL | https://bragi-qloo.vercel.app |
| SHA | `149f1b9` |
| Credential | Treat as unrotated/`hack_` until Daniel rotates — **merge blocked** |

## Feature branch hardening

- Ranking uses **`query.affinity`**, never popularity  
- Candidate vs aggregate explainability separated  
- Removed false Qloo IDs (MAMM = Mexico City; Orquideorama ≠ full Jardín program)  
- Indexed Medellín places: Teatro Pablo Tobón, Teatro Metropolitano  
- Insights concurrency/timeout budget for 60s route  
- Docs: [`QLOO_NATIVE_VALIDATION.md`](QLOO_NATIVE_VALIDATION.md)

## Verify

```bash
npm ci && npm run typecheck && npm test && npm run lint && npm run build
npm audit --omit=dev && npm run qloo:ablation
```

## PR

https://github.com/DOVRC/bragi-qloo/pull/1 · tip `1df6186` · CI green · Vercel preview READY  

Preview: https://bragi-qloo-jnh9ow50s-daniel-o-s-projects1.vercel.app/  
(**No Preview `QLOO_API_KEY`** — Explore correctly errors; live Path A verified locally.)

## Remaining before merge

1. Rotate Qloo API key → update Vercel Production **and** Preview Secrets  
2. Re-run Taste Journey steps 2–4 on preview with live key  
3. Merge via GitHub PR only — **not merged** while key unrotated  

