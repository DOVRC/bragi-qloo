# Project status — resume checkpoint

**Last updated:** 2026-10-30 (Taste Journey + evidence-aware matching)  
**Active branch:** `main`  
**Baseline before this task:** `7f1c2f6d9f3ad14a2f315387367143a6a52f677a`  
**Branch tip:** verify with `git ls-remote origin refs/heads/main`  
**Target remote:** https://github.com/DOVRC/bragi-qloo  

## Completed

- Guided **TasteJourney** (interests → Qloo connections → Medellín → why)  
- Contribution-aware catalogue scoring + `evidenceStrength`  
- `DiscoveryTrace` for affinity visualization / comparison  
- Offline ablation (`npm run qloo:ablation`) + docs  
- Tests: **25** · typecheck/lint/build gates  

## Docs

- [`GUIDED_DEMO.md`](GUIDED_DEMO.md)  
- [`QLOO_VALUE_VALIDATION.md`](QLOO_VALUE_VALIDATION.md)  
- [`UI_QA_REPORT.md`](UI_QA_REPORT.md)  

## Remaining

1. Rotate exposed Qloo key + Vercel env  
2. Optional Playwright E2E  
3. Licensed venue photography only if available  

## Verify

```bash
npm run typecheck && npm test && npm run lint && npm run build
npm run qloo:ablation
npm run qloo:check-env && npm run qloo:smoke
npm run dev
```
