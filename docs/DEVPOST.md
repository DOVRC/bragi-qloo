# Bragi — Devpost submission copy

**Production:** https://bragi-qloo.vercel.app  
**Repo:** https://github.com/DOVRC/bragi-qloo  

## Elevator pitch

Bragi turns the culture you already love into discoverable Medellín independent creators, projects, and places — powered by Qloo taste intelligence, with an inspectable path from interest → affinity → local match.

## The problem

International taste graphs rarely surface underrepresented local independent creators. People who love alternative rock, experimental sound, hip-hop, or video art often rediscover the same global names — while Medellín’s DIY bands, labels, and art projects stay invisible unless you already know where to look.

Static city guides and keyword search do not explain *why* a local creator fits a taste. Attaching an API without provenance is not cultural discovery.

## What we built

You choose interests and an intent (**Creators**, **Places**, or **Surprise me**). Bragi resolves those signals with **Qloo Search, Tags, and Insights**, then ranks a curated Medellín catalogue with dual-path evidence:

1. **Qloo-native** ranking for catalogue venues that carry verified Qloo place IDs (`query.affinity`, never popularity-as-affinity).
2. **Bragi catalogue** matching for creators and projects using Insights affinities/tags + transparent scores.

Signature UX:

- **Taste → local creator bridge** — evidence-backed hops only (interest → Search resolve → Insights affinity → Bragi match → portfolio).
- **What Qloo changed** — same input compared as user-signal-only vs Qloo-enriched (no extra API calls, no invented lifts).
- **Taste DNA**, candidate explainability, More like this / Not my style / Surprise me again (`prioritySignals` inside a 5-signal resolve budget).

Live mode never invents demonstration profiles when evidence is empty.

## What Qloo actually contributes

Qloo is not a logo on a static list. For the same interests, Insights often introduce cultural entities and tags the user never typed. Bragi shows which local recommendations **depend on that evidence** versus direct catalogue keyword overlap — and admits when both paths agree.

## Catalogue integrity

The Medellín catalogue is audited for geography and identity. A Bogotá-origin band previously mislabeled as Medellín was **removed**. New verified entries include Ferales, Nómada, tapelooplab, Intermediaciones, and Siempre Llueve Recs (see `docs/CATALOGUE_AUDIT.md`).

## How to try it (judges)

1. Open https://bragi-qloo.vercel.app  
2. Click **Local creators demo** (or pick 5+ interests). Choose **Creators**.  
3. Explore Connections → Medellín.  
4. Inspect the **Taste → local creator** bridge and **What Qloo changed**.  
5. Open Why / evidence; try More like this and Not my style.

## Screenshots

| File | Content |
| --- | --- |
| `docs/screenshots/00-production-hero.png` | Production landing |
| `docs/screenshots/01-interests-five.png` | Interests + intent |
| `docs/screenshots/02-connections-live.png` | Live Qloo affinities |
| `docs/screenshots/02-taste-dna.png` | Taste DNA |
| `docs/screenshots/03-feedback-rerank.png` | Feedback re-rank |
| `docs/screenshots/04-why-explainability.png` | Native explainability |
| `docs/screenshots/05-creator-discovery.png` | Creator discovery |
| `docs/screenshots/06-taste-bridge.png` | Taste→creator bridge (post-sprint) |
| `docs/screenshots/07-what-qloo-changed.png` | What Qloo changed (post-sprint) |

## Tech stack

Next.js 15 · React 19 · Qloo Hackathon API (Search / Tags / Insights) · Vercel · TypeScript  

## Limitations & vision

- Catalogue is curated and finite — not a complete city inventory.  
- Creator matches are evidence-aware Bragi scores informed by Qloo, not claims that Qloo ranked each artist entity.  
- Temporary hackathon credentials should be rotated after the event.  
- Next: broader verified coverage, multilingual UX, organizer tooling that preserves provenance.

## Team

Daniel Ossa Velásquez · Yulian Bedoya — Colombia · Qloo Agentic Hackathon 2026
