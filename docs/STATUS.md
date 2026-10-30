# Project status — resume checkpoint

**Last updated:** 2026-10-30 (Phase 2 — live Qloo validation)  
**Active branch:** `feature/qloo-taste-agent`  
**Baseline (pre-hackathon) SHA:** `29c39af7805833e87d215602ee769d654f9f0715` (`main`)  
**Local path:** `C:\Users\Usuario\Documents\HACKATHONS\HACKATHON QLOO\Bragi`  
**Working tree:** dirty (uncommitted) — **not pushed**

## How to resume

1. Read [`../AGENTS.md`](../AGENTS.md).
2. Read this file.
3. Skim [`QLOO_INTEGRATION.md`](QLOO_INTEGRATION.md) (live findings).
4. Remaining P0: LICENSE, authorize push/deploy, Devpost materials.

## Phase 2 outcome

**Genuine end-to-end live discovery works** with `SAMPLE_DATA_MODE=false` and a configured `QLOO_API_KEY`.

### Verified this session

| Check | Result |
| --- | --- |
| Env (redacted) | `QLOO_API_KEY` PRESENT · `SAMPLE_DATA_MODE=false` · hackathon base URL |
| `npm run qloo:smoke` | OK — search returns entities |
| `GET /api/health/qloo` | 200 · `ok:true` · `entityCount:1` |
| `POST /api/discover` live | 200 · `mode:live` · resolved Radiohead + Studio Ghibli |
| Live e2e Profile A | OK — Radiohead, Studio Ghibli, Jazz At Lincoln Center → Teatro/MAMM-style set |
| Live e2e Profile B | OK — Reggaeton, Urban Fashion, Latin Dance → Metropolitano/Comuna 13 set |
| Differentiation | **DIFFERENT_TOP_SET** (A ≠ B) |
| `npm test` | **22/22** pass |
| `npm run typecheck` / `lint` / `build` | Pass |

### Sanitized live examples (no secrets)

- Search `Radiohead` → entity name `Radiohead` (id redacted `70CA…591C`)
- Untyped search `Studio Ghibli` → `Studio Ghibli` (typed `movie`/`brand` filters were **noisy** — fixed via name-match + untyped fallback)
- Insights artist from Radiohead → affinities e.g. Thom Yorke, Beck, Gorillaz, Mogwai
- Profile B Insights → latin urban artists (e.g. Makano / Rakim Y Ken-Y class) + brand/place plan

## Architecture notes (Phase 2 changes)

- Name-aware entity resolution (`src/lib/resolve.ts`) — rejects bad typed hits
- Conditional Insights plan (`planInsights`) from signal kinds
- `/v2/tags` for genre/theme signals
- Tag prioritization + score caps (Insights amenity tag explosion)
- Insights TIMEOUT continues with partial evidence (no silent sample fallback)
- Live mode prefers verified catalogue; demo only if verified empty
- UI: live/sample banner, Profile A/B presets, taste evidence panel, honest empty state

## Remaining P0 blockers

1. **LICENSE** file still missing at repo root (ownership confirmation)
2. **Push** of `feature/qloo-taste-agent` not authorized
3. **Public deploy** (Vercel) not authorized — set server env without committing secrets
4. Devpost English description + submission before deadline

## Commands

```bash
cd apps/taste-agent
npm run qloo:check-env
npm run qloo:smoke
npm run qloo:e2e
npm run typecheck && npm test && npm run build
npm run dev
```
