# Devpost submission checklist

Deadline: **2026-10-30 11:45 PM EDT** (22:45 Colombia)

## Required

- [x] Public repository URL — https://github.com/DOVRC/bragi-qloo
- [x] Detectable open-source **LICENSE** file (MIT)
- [x] Externally hosted demo — https://bragi-qloo.vercel.app (public; no auth wall)
- [x] Live Qloo on that URL (`/api/health/qloo` ok; Search + Discover live; Taste Journey verified)
- [x] PR #1 + PR #2 merged to `main` — production SHA `39ae762` (+ integrity follow-up if merged)
- [x] English product description draft — [DEVPOST.md](DEVPOST.md)
- [x] Setup instructions — root `README.md` + [DEPLOYMENT.md](DEPLOYMENT.md)
- [x] Testing instructions — `npm test`, `npm run qloo:smoke`, `npm run qloo:e2e`, [GUIDED_DEMO.md](GUIDED_DEMO.md)
- [x] Original Bragi vs Taste Agent — README + this table
- [x] Evidence of real Qloo integration — [QLOO_INTEGRATION.md](QLOO_INTEGRATION.md) + Taste bridge / What Qloo changed
- [x] Privacy/credential review — `.env*` gitignored; no `NEXT_PUBLIC_` key; SSO off for demo
- [ ] Devpost entry fields complete; Representative submits

## Strongly recommended

- [x] Screenshots of Taste Journey (see `docs/screenshots/`, including bridge + What Qloo changed)
- [x] `docs/QLOO_INTEGRATION.md` linked from README / docs
- [x] Live quality note — [LIVE_QUALITY.md](LIVE_QUALITY.md) regenerated on production
- [x] Responsive check — production homepage loads desktop

## Optional

- [ ] Demo video (not required)
- [ ] Discord #api-help if quota issues

## Technical verification before submit

```bash
npm ci
npm run typecheck
npm test
npm run build
curl -s https://bragi-qloo.vercel.app/api/health/qloo
# expect ok:true — never SAMPLE_DATA_MODE=true
# hip-hop smoke (creators intent) should lead with Alcolirykoz on current catalogue
```

## Deployment (done)

1. Repo: `DOVRC/bragi-qloo` · root `.` · Node 22 · CI on GitHub Actions  
2. Vercel: `daniel-o-s-projects1` / `bragi-qloo` · Git CD on `main`  
3. Env: `QLOO_API_KEY` Secret on Preview + Production; `SAMPLE_DATA_MODE=false` on Production  
4. Paste https://bragi-qloo.vercel.app into Devpost  

## Original vs new

| Original Bragi | Hackathon Taste Agent |
| --- | --- |
| ICP canisters, Internet Identity | Next.js + server Route Handlers |
| Artist user CRUD | Qloo Search + Insights |
| Marketplace/community vision | Cultural DNA → Medellín catalogue matching |
| Spanish README focus | English submission materials |

## Credential hygiene

- [x] `.env*` gitignored; `.vercel/` gitignored  
- [ ] Recommended: rotate temporary hackathon key after submission  
- [x] Sample-data mode off intended for production (`SAMPLE_DATA_MODE=false`)
