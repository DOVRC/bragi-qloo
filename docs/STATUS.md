# Project status — resume checkpoint

**Last updated:** 2026-10-30 (intelligent cultural matchmaking)  
**Active branch:** `feature/qloo-native-intelligence`  
**Target remote:** https://github.com/DOVRC/bragi-qloo  

## Production (main — untouched)

| Item | Value |
| --- | --- |
| URL | https://bragi-qloo.vercel.app |
| SHA | `149f1b9` |
| Credential | Treat as unrotated/`hack_` until Daniel rotates — **merge blocked** |

## Feature branch — matchmaking upgrade

- Intent-aware merge (`creators` / `places` / `mixed`) — native Path A no longer monopolizes all slots
- Affinity highlight uses evidence-backed ids (explainability + hook overlap), never venue self-id
- Live mode never injects demonstration catalogue profiles
- Adaptive Insights domain planning from resolved Qloo types (no blind artist default)
- Discovery deadline 50s; bounded Search/Tags/Insights parallelism; instance GET cache
- Taste Journey intent selector + creator-aware “Why” copy
- Quality suite: 10 cultural profiles (see matchmaking.quality.test metrics)

## Verify

```bash
npm ci && npm run typecheck && npm test && npm run lint && npm run build
npm audit --omit=dev
```

## PR

https://github.com/DOVRC/bragi-qloo/pull/1  

Preview requires rotated Preview `QLOO_API_KEY` for live Taste Journey steps 2–4.

## Remaining before merge

1. Rotate Qloo API key → Vercel Production **and** Preview Secrets  
2. Re-run Taste Journey steps 2–4 on preview with live key  
3. Merge via GitHub PR only — **not merged** while key unrotated  
