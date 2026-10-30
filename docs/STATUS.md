# Project status — resume checkpoint

**Last updated:** 2026-10-30 (production CI/CD)  
**Active branch:** `main`  
**Remote tip:** verify with `git ls-remote origin refs/heads/main`  
**Target remote:** https://github.com/DOVRC/bragi-qloo  

## Production

| Item | Value |
| --- | --- |
| Public URL | https://bragi-qloo.vercel.app |
| Vercel scope | `daniel-o-s-projects1` (`dovrc`) |
| Vercel project | `bragi-qloo` |
| CD | Native Git → `DOVRC/bragi-qloo` / `main` |
| CI | https://github.com/DOVRC/bragi-qloo/actions/workflows/ci.yml |
| SSO / auth wall | Disabled (public demo) |
| Live Qloo | Verified — `/api/health/qloo` ok; live Search + Discover; Taste Journey steps 1–4 |

Homepage and Taste Journey UI are public (HTTP 200). Production `QLOO_API_KEY` is a Vercel Secret. Prefer provider rotation if any prior key appeared in screenshots. Do not use `SAMPLE_DATA_MODE=true` in production.

## Completed

- Guided **TasteJourney** + contribution-aware evidence  
- GitHub Actions CI (Node 22: typecheck, test, lint, build, audit)  
- Vercel project linked; Git connected; non-secret prod env set  
- Public production URL without login wall  
- Deployment docs: [`DEPLOYMENT.md`](DEPLOYMENT.md)

## Remaining

1. Rotate at Qloo if the prior key was screenshot-exposed, then update the Vercel Secret  
2. Devpost entry paste https://bragi-qloo.vercel.app + English description  
3. Optional screenshots for Devpost (no secrets)  

## Verify

```bash
npm run typecheck && npm test && npm run lint && npm run build
# after rotated key on Vercel:
curl -s https://bragi-qloo.vercel.app/api/health/qloo
```
