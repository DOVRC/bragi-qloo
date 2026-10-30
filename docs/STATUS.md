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
| Live Qloo | Production `QLOO_API_KEY` set as Vercel **Secret**; redeploy required for lambdas |

Homepage and Taste Journey UI are public (HTTP 200). Prefer a provider-rotated key if any prior key appeared in screenshots. Do not use `SAMPLE_DATA_MODE=true` in production.

## Completed

- Guided **TasteJourney** + contribution-aware evidence  
- GitHub Actions CI (Node 22: typecheck, test, lint, build, audit)  
- Vercel project linked; Git connected; non-secret prod env set  
- Public production URL without login wall  
- Deployment docs: [`DEPLOYMENT.md`](DEPLOYMENT.md)

## Remaining

1. Confirm `/api/health/qloo` → `ok: true` after env-aware redeploy; rotate at Qloo if the prior key was screenshot-exposed  
2. One live guided demo smoke (`GUIDED_DEMO.md`)  
3. Devpost entry paste URL + description  

## Verify

```bash
npm run typecheck && npm test && npm run lint && npm run build
# after rotated key on Vercel:
curl -s https://bragi-qloo.vercel.app/api/health/qloo
```
