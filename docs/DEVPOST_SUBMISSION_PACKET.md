# Bragi — Devpost submission packet

**Status:** Packet ready for a human to paste into Devpost.  
**Devpost submission:** **NOT CONFIRMED** — preparing materials is not the same as submitting. A team member must complete the form on https://qloo.devpost.com/ and verify submitted status.

**Live demo:** https://bragi-qloo.vercel.app  
**GitHub:** https://github.com/DOVRC/bragi-qloo  
**License:** MIT — repository root [`LICENSE`](../LICENSE)  
**Guided demo:** [GUIDED_DEMO.md](GUIDED_DEMO.md)  
**Architecture / deploy:** [README.md](../README.md) · [DEPLOYMENT.md](DEPLOYMENT.md)

---

## Project name

**Bragi Taste Agent** (short: **Bragi**)

## Strong one-line tagline

From the culture you love to Medellín’s independent creators — powered by Qloo, explained by Bragi.

## Short description (≤250 characters)

Bragi turns the artists, films, and genres you love into discoverable Medellín creators and places. Qloo Search, Tags, and Insights supply affinities; Bragi ranks a curated catalogue with inspectable evidence — never silent sample fallbacks.

*(Character count: ~228)*

## Clear project description (English)

Bragi is a Qloo-powered cultural discovery agent for Medellín. You share interests and an intent (Creators, Places, or Surprise me). The server resolves signals with **Qloo Search / Tags / Insights**, builds a taste profile, and ranks a curated local catalogue. Dual ranking paths keep provenance honest: **qloo_native** for catalogue venues with verified Qloo place IDs (`query.affinity`), and **bragi_catalogue** for independent creators and projects scored against Insights entities/tags with an evidence floor (`MIN_MATCH_SCORE = 6`).

Signature surfaces for judges: **Taste DNA**, **Taste → local creator** bridge (evidence-backed hops only), **What Qloo changed** (same city/intent/exclusions/score floor — user signals alone vs Search/Insights-enriched Path B), outbound portfolio links, and feedback (**More like this** / **Not my style** / **Surprise me again**) that re-prioritizes resolve signals inside a five-signal budget.

Live mode never invents demonstration profiles when verified matches are empty.

## Problem and target audience

International taste graphs and city guides rarely surface underrepresented local independents with an inspectable *why*. Target audience: culturally curious residents and visitors in Medellín, plus judges evaluating agentic Qloo apps that must show real Search/Insights value rather than keyword lists.

## Why Qloo is essential

Without Qloo, matches collapse to catalogue keyword overlap. Search resolves entities; Tags ground genres; Insights introduce affinities and theme tags the user never typed. **What Qloo changed** shows Path B identities that clear the evidence floor only after Search/Insights enrichment — same constraints, no invented lifts.

## Main features

1. Live interest autocomplete (`GET /api/search`)
2. Multi-step Taste journey: Interests → Connections → Medellín → Why
3. Creators / Places / Surprise me intents
4. Taste DNA from the current response (not a stored profile)
5. Taste-to-Creator Bridge with labeled Qloo vs Bragi hops
6. What Qloo Changed comparable Path B delta
7. Evidence strength + contribution provenance
8. More like this / Not my style / Surprise me again
9. Verified portfolio / project outbound links (`rel=noopener`)
10. Honest empty/error states in live mode

## Technical architecture

```
Browser (Next.js 15 / React 19)
  → POST /api/discover | GET /api/search | GET /api/health/qloo
      → DiscoveryAgent
          → Qloo Hackathon API (server-side X-Api-Key only)
          → Taste profile + CatalogueService ranking
```

Hosted on Vercel (`bragi-qloo`). `QLOO_API_KEY` is a server Secret — never `NEXT_PUBLIC_`. CI: GitHub Actions typecheck / test / lint / build / audit.

## Challenges and lessons

- Insights payloads can emit many URN variants for the same humanized tag leaf; scoring each variant stacked points and inflated cross-genre catalogue hits (e.g. multiple “alternative rock” leaves under a hip-hop run). Mitigated with general-purpose leaf dedupe — not artist blacklists.
- Soft comparison floors previously exaggerated Qloo deltas; Path B now uses the same `MIN_MATCH_SCORE` as production ranking.
- Catalogue geography must be audited; mislabeled cities erode trust faster than missing coverage.

## What makes Bragi original

Bragi does not pretend Qloo ranked every local creator. It shows **where Qloo ends** (Search/Insights evidence) and **where Bragi begins** (curated Medellín catalogue + transparent scores), with bridge and delta UX built for judge inspection.

## Credible impact and expansion potential

Hackathon-scope impact: a working live demo that connects real Qloo affinities to verified Medellín independents with inspectable provenance. Expansion (not claimed as shipped): broader verified catalogue coverage, multilingual UX, organizer tooling that preserves the same evidence trail. **No invented user counts, accuracy lifts, partnerships, or traction metrics.**

## Live demo URL

https://bragi-qloo.vercel.app

## GitHub repository URL

https://github.com/DOVRC/bragi-qloo

## MIT license location

https://github.com/DOVRC/bragi-qloo/blob/main/LICENSE

## Team

- **Daniel Ossa Velásquez**
- **Yulian Bedoya**

## Suggested screenshot order

Confirm each file still matches current Production UI before upload.

| Order | File | Content |
| --- | --- | --- |
| 1 | `docs/screenshots/00-production-hero.png` | Production landing / brand hero |
| 2 | `docs/screenshots/01-interests-five.png` | Interests + Creators intent |
| 3 | `docs/screenshots/02-connections-live.png` | Live Qloo affinities |
| 4 | `docs/screenshots/02-taste-dna.png` or `03-taste-dna.png` | Taste DNA |
| 5 | `docs/screenshots/05-creator-discovery.png` | Medellín creator cards |
| 6 | `docs/screenshots/06-taste-bridge.png` | Taste→creator bridge |
| 7 | `docs/screenshots/07-what-qloo-changed.png` | What Qloo changed |
| 8 | `docs/screenshots/04-why-explainability.png` | Why / evidence |
| 9 | `docs/screenshots/03-feedback-rerank.png` | Feedback re-rank |

## Exact 60–90 second judge walkthrough

1. Open https://bragi-qloo.vercel.app — no login wall.
2. Click **Local creators demo** (alternative rock · post-punk · experimental music); intent **Creators**.
3. **Explore my connections** → show resolved entities and Insights affinities.
4. **See Medellín matches** → local independents (order not guaranteed).
5. Point at **Taste → local creator** and **What Qloo changed**.
6. Open a portfolio link; run **More like this** or **Not my style** once.
7. Say aloud: Qloo supplies Search/Insights; Bragi ranks the curated catalogue.

**Fallback:** **Art-house explorer** or **Urban culture explorer** if the preferred run is thin or times out. Live mode shows an error banner — no silent sample fill.

Full script: [GUIDED_DEMO.md](GUIDED_DEMO.md).

---

## Submission checklist (human)

- [ ] Paste fields into Devpost
- [ ] Upload screenshots in suggested order (re-capture if UI drifted)
- [ ] Link live demo + GitHub + confirm LICENSE visible
- [ ] Submit and screenshot confirmation page
- [ ] Mark this packet’s status **CONFIRMED** only after that
