# Project status — resume checkpoint

**Last updated:** 2026-10-30 (Qloo native intelligence — feature branch)  
**Active branch:** `feature/qloo-native-intelligence`  
**Remote tip:** verify with `git ls-remote origin refs/heads/main`  
**Target remote:** https://github.com/DOVRC/bragi-qloo  

## Production (main — leave untouched until credential rotation)

| Item | Value |
| --- | --- |
| Public URL | https://bragi-qloo.vercel.app |
| Live Qloo | Working on main deploy |
| Credential | Treat screenshot-exposed `hack_` key as **compromised until rotated** — do not merge this feature until rotated |

## This feature branch

- Dual-path ranking: **Qloo-native** (`filter.results.entities` + explainability) vs **Bragi catalogue**
- `feature.explainability` normalized and surfaced in Why cards
- Cross-domain label requires traceable domain change (`qloo_backed_affinity` otherwise)
- Independent creators/projects: Alcolirykoz, Odio a Botero, Casa Tres Patios, Centro Cultural Moravia
- Validation: [`QLOO_NATIVE_VALIDATION.md`](QLOO_NATIVE_VALIDATION.md)

## Verify

```bash
npm ci
npm run typecheck && npm test && npm run lint && npm run build
npm audit --omit=dev
npm run qloo:ablation
```

## Remaining

1. Rotate Qloo API key; update Vercel Secret  
2. Preview deploy / browser Taste Journey QA  
3. Merge to main only after 1–2  
4. Devpost screenshots + submit  
