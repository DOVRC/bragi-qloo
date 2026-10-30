# Project status — resume checkpoint

**Last updated:** 2026-10-30 (Security hardening for Vercel)  
**Active branch:** `main`  
**Remote SHA:** `d07f37fb13de6052d67b60c2371ee9566a0b8c32`  
**Hardening commit:** `4ed90a819432b9fff9bfbb936508d1d9fdae6559`  
**Target remote:** https://github.com/DOVRC/bragi-qloo  
**Local path:** `C:\Users\Usuario\Documents\HACKATHONS\HACKATHON QLOO\Bragi`

## How to resume

1. Read [`../AGENTS.md`](../AGENTS.md)  
2. Read this file  
3. Work at **repository root** (Next.js app)  
4. Push only to `DOVRC/bragi-qloo`

## Security hardening (this session)

- Upgraded `next` + `eslint-config-next` **15.1.0 → 15.5.28** (patched for CVE-2025-55182 / RSC advisories; latest 15.x stable)  
- Upgraded `react` / `react-dom` → **19.3.1** (patched RSC line)  
- Forced nested `postcss` → **8.5.32** via `overrides` (Next 15 still vendors 8.4.31; avoids forced Next 16)  
- `npm audit --omit=dev` → **0 vulnerabilities**  
- Quality: typecheck ✅ · test 22/22 ✅ · lint ✅ · build ✅  
- Client static bundle secret scan: clean  
- API `maxDuration`: discover 60s, search/health 30s; `vercel.json` framework `nextjs`

## Vercel production checklist

| Setting | Value |
| --- | --- |
| Framework | Next.js |
| Root Directory | `.` (repository root) |
| Production Branch | `main` |
| Env (server) | `QLOO_API_KEY`, `QLOO_API_BASE_URL=https://hackathon.api.qloo.com` |
| Env | `SAMPLE_DATA_MODE=false` |
| Auth wall | none (public for judges) |
| Secrets | never `NEXT_PUBLIC_*` for Qloo key |

### Deploy steps

1. **Rotate** any previously exposed Qloo API key, then set the new key only in Vercel Project → Settings → Environment Variables (Production).  
2. Import `DOVRC/bragi-qloo` in Vercel; confirm Root Directory is `.` and Production Branch is `main`.  
3. Set server env above; redeploy.  
4. Smoke: open `/api/health/qloo`, run a discovery from `/`, confirm live (not sample) evidence.  
5. Optional local: `npm run qloo:check-env && npm run qloo:smoke`

## Remaining blockers

1. **Rotate exposed Qloo key** before/with production deploy (do not commit keys).  
2. **Vercel project create + env** (manual).  
3. Devpost URL + write-up.  
4. Dev-only `npm audit` still reports vitest/vite/esbuild/tinypool; production audit is clean. Upgrade vitest major separately if desired.

## Verify

```bash
npm ci --legacy-peer-deps
npm run typecheck && npm test && npm run lint && npm run build
npm audit --omit=dev
```
