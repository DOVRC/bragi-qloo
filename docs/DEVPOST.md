# Devpost materials — Bragi Taste Agent

**Public demo (production):** https://bragi-qloo.vercel.app  
**Repository:** https://github.com/DOVRC/bragi-qloo  
**PR (feature branch):** https://github.com/DOVRC/bragi-qloo/pull/1  

Screenshots (no secrets): `docs/screenshots/`

| File | Content |
| --- | --- |
| `00-production-hero.png` | Production landing hero |
| `01-hero-local.png` | Interests + Creators / Places / Surprise me intent |
| `02-taste-dna.png` | Taste DNA evidence panel (live Qloo) |
| `03-feedback-rerank.png` | Catalogue match after Not my style re-rank |

## Paste-ready English description

**Bragi Taste Agent** helps people discover Medellín creators and cultural spaces from the music, film, and culture they already love. You choose interests and an intent (Creators, Places, or Surprise me). Bragi resolves those signals with **Qloo Search, Tags, and Insights**, then ranks a curated local catalogue with dual-path evidence:

- **Qloo-native path** — verified Medellín place entity IDs scored with Insights `query.affinity` and candidate explainability (never popularity-as-affinity).
- **Bragi catalogue path** — independent creators and projects matched to Qloo affinities when they are not confidently indexed in Qloo.

The Taste Journey shows connections, Taste DNA (evidence shape of the run), recommendations with More like this / Not my style / Surprise me again, and a Why step with inspectable provenance. Live mode never invents demonstration profiles when evidence is empty.

## Built with

Next.js 15 · React 19 · Qloo Hackathon API (`hackathon.api.qloo.com`) · Vercel · TypeScript · Vitest

## How Qloo is used (honest)

| Capability | Usage |
| --- | --- |
| Search | Resolve named tastes to entities |
| Tags | Resolve genre/theme signals |
| Insights | Affinity entities/tags + native `filter.results.entities` ranking |
| Explainability | Per-candidate contributions; aggregate kept separate |

## Demo script

1. Open https://bragi-qloo.vercel.app (or the PR preview after Preview `QLOO_API_KEY` is set).
2. Keep Art-house interests; choose **Surprise me**; Explore.
3. Inspect Connections (live affinities), then Medellín matches — expect a native venue + creators when evidence supports it.
4. Open Taste DNA; try **Not my style** on a card; confirm exclusion + re-rank.
5. Open Why / evidence on a native card; note `query.affinity` vs popularity language.

## Known limitations (do not overclaim)

- Preview currently has no `QLOO_API_KEY` (Production-only Secret) — live Explore fails honestly on preview until Preview Secret is added.
- Local/production credential still appears `hack_`-prefixed until Daniel rotates — treat as compromised for merge.
- Native affinity comparison UI appears only when ≥2 native candidates return affinity in one run.
- Event tickets and live calendars are not booked; public URLs are pointers only.

## Merge / production gate

Do **not** merge PR #1 until: rotated Qloo key in Production **and** Preview, CI green, preview Taste Journey live QA, no secret leakage.
