# Devpost submission checklist

Deadline: **2026-10-30 11:45 PM EDT**

## Required

- [x] Public repository URL — https://github.com/DOVRC/bragi-qloo
- [x] Detectable open-source **LICENSE** file (MIT)
- [x] Externally hosted demo — https://bragi-qloo.vercel.app (public; no auth wall)
- [x] Live Qloo on that URL (`/api/health/qloo` ok; Search + Discover live; Taste Journey verified)
- [ ] Merge `feature/qloo-native-intelligence` only after rotated Qloo key + preview QA ([QLOO_NATIVE_VALIDATION.md](QLOO_NATIVE_VALIDATION.md)) — includes intent-aware matchmaking + affinity highlight fixes
- [ ] English product description on Devpost (what it does + why Qloo-powered)
- [x] Setup instructions — root `README.md` + [DEPLOYMENT.md](DEPLOYMENT.md)
- [x] Testing instructions — `npm test`, `npm run qloo:smoke`, `npm run qloo:e2e`, [GUIDED_DEMO.md](GUIDED_DEMO.md)
- [x] Original Bragi vs Taste Agent — README + this table
- [x] Evidence of real Qloo integration — [QLOO_INTEGRATION.md](QLOO_INTEGRATION.md)
- [x] Privacy/credential review — `.env*` gitignored; no `NEXT_PUBLIC_` key; SSO off for demo
- [ ] Devpost entry fields complete; Representative submits

## Strongly recommended

- [ ] Screenshots of Taste Journey (no secrets)
- [x] `docs/QLOO_INTEGRATION.md` linked from README / docs
- [ ] Live smoke note in STATUS after rotated key
- [x] Responsive check — production homepage loads desktop; re-check mobile after key

## Optional

- [ ] Demo video (not required)
- [ ] Discord #api-help if quota issues

## Technical verification before submit

```bash
npm ci
npm run typecheck
npm test
npm run build
# production (after rotated key):
curl -s https://bragi-qloo.vercel.app/api/health/qloo
# expect ok:true — never SAMPLE_DATA_MODE=true
```

## Deployment (done)

1. Repo: `DOVRC/bragi-qloo` · root `.` · Node 22 · CI on GitHub Actions  
2. Vercel: `daniel-o-s-projects1` / `bragi-qloo` · Git CD on `main`  
3. Env names: `QLOO_API_KEY`, `QLOO_API_BASE_URL`, `SAMPLE_DATA_MODE=false`  
4. Paste https://bragi-qloo.vercel.app into Devpost after live Qloo confirmed  

## Original vs new

| Original Bragi | Hackathon Taste Agent |
| --- | --- |
| ICP canisters, Internet Identity | Next.js + server Route Handlers |
| Artist user CRUD | Qloo Search + Insights |
| Marketplace/community vision | Cultural DNA → Medellín catalogue matching |
| Spanish README focus | English submission materials |

## Credential hygiene

- [x] `.env*` gitignored; `.vercel/` gitignored  
- [ ] Rotate if previously shared/screenshot-exposed; set only via Vercel secure input  
- [x] Sample-data mode off intended for production (`SAMPLE_DATA_MODE=false`)
