# Bragi Taste Agent — UI / UX QA Report

**Date:** 2026-10-30  
**Baseline SHA:** `fa767d3c77d07efbdc4ac78a881b901d7736c3a6`  
**App under test:** `http://localhost:3000` (Next.js 15.5.28)  
**Figma:** [Bragi file AmQPUAtlrZurNAtIAu6WhV](https://www.figma.com/design/AmQPUAtlrZurNAtIAu6WhV/Bragi?node-id=19-2664) (landing overview at 5% zoom; signup wall limited deep inspect)  
**Screenshot artifacts (gitignored):** `qa-artifacts/before/`, `qa-artifacts/after/`, `qa-artifacts/figma/`

---

## 1. Original design observations (Figma)

- Navy headers / cream page bodies with lavender accents.
- Large rounded imagery cards and editorial single-column rhythm.
- Strong Bragi wordmark; serif display + clean sans UI.
- Artist marketplace flows (profiles, hearts, contracts) — **not** product goals for Taste Agent.
- Visual continuity target: cream canvas, navy/lavender contrast, rounded cultural cards, expressive art — not marketplace checkout.

Authorized asset used: `/public/brand/background.png` (abstract night/moon illustration).

---

## 2. BEFORE audit (baseline UI)

| Dimension | Score (1–5) | Evidence |
| --- | --- | --- |
| A Brand consistency | 2 | Logo present; hero was flat gradient + “Cultural DNA” tech panel (`qa-artifacts/before/desktop-1440x900.png`) |
| B Layout composition | 2 | Form | results dashboard; weak artistic plane |
| C Typography | 3 | Fraunces + Outfit coherent but used for technical copy |
| D Spacing / rhythm | 3 | Decent spacing; empty dashed results well looked unfinished |
| E Color hierarchy | 3 | Palette present; dark hero over-dominated first impression |
| F Imagery | 1 | No brand art in hero; text-only DNA card |
| G Component quality | 2 | White text cards; score-forward recommendations |
| H Interaction / motion | 2 | Autocomplete races; weak pending UX |
| I Mobile | 3 | Menu worked; hero still tech-heavy (`before/mobile-390x844.png`) |
| J Product feel | 2 | Read as agent console more than cultural product |

### Key BEFORE issues

| Screen | Severity | Finding | Root cause |
| --- | --- | --- | --- |
| Hero 1440 | P0 | Flat gradient + developer “Cultural DNA” box | No brand imagery; jargon-first panel |
| Discover | P0 | “Preset A/B”, “Qloo entity”, “Agent steps” primary | Internal labels in consumer UI |
| Cards | P0 | Text-only white cards + dominant “Bragi rank score” | Missing visual treatment; metric-first hierarchy |
| Autocomplete | P1 | No abort / keyboard / Escape | Incomplete combobox |
| Results order | P1 | Agent steps before recommendations | Developer-first information architecture |

---

## 3. Implemented fixes

- **Hero:** Full-bleed brand illustration + editorial headline; cultural image card (authorized asset only).
- **Header:** Sticky; transparent over hero → cream when scrolled; Escape closes mobile nav; consumer CTA “Find my matches”.
- **Discovery:** Journey framing; recommendations first; honest skeletons; duplicate-submit guard; preserve tastes on network error; scroll to results.
- **Taste selector:** Consumer mood labels; AbortController + request id; listbox keyboard / Escape / outside click; “from taste graph” instead of “Qloo entity”.
- **Cards:** Category gradient art headers; “Why you’ll like this” primary; score demoted (removed from face); Official site CTA.
- **Evidence / steps:** Collapsed disclosures for judges.

---

## 4. AFTER verification

| Dimension | Score (1–5) | Evidence |
| --- | --- | --- |
| A Brand consistency | 4 | Brand art + logo; cream/navy/lavender (`after/desktop-1440x900.png`, `after/mobile-390x844.png`) |
| B Layout composition | 4 | Editorial hero; discovery journey with inviting empty state |
| C Typography | 4 | Display / section / card / body / meta hierarchy clearer |
| D Spacing / rhythm | 4 | Larger radii, softer shadows, less dashed emptiness |
| E Color hierarchy | 4 | Cream workspace; accent CTAs; live banner restrained |
| F Imagery | 4 | Authorized illustration dominant; category gradients (not fake photos) |
| G Component quality | 4 | Cultural cards with why-first copy (`after/recommendations-1440.png`) |
| H Interaction / motion | 4 | Skeletons; combobox; Escape; disabled pending (`after/loading-skeletons.png`, `after/autocomplete-1440.png`) |
| I Mobile | 4 | Hero art + Menu/Close drawer (`after/mobile-nav-390.png`) |
| J Product feel | 4 | Reads as cultural discovery; evidence remains available |

Remaining vs Figma: no photographic artist portraits (intentionally avoided fabrication); marketplace modules absent by design; Fraunces/Outfit retained (coherent; not Fira Sans).

---

## 5. Browser interaction matrix

| # | Case | Result |
| --- | --- | --- |
| 1 | First load | Pass |
| 2 | Nav → discovery | Pass |
| 3–4 | Chip select / remove | Pass |
| 5 | Mood presets | Pass (relabeled) |
| 6–10 | Autocomplete search, listbox, Escape | Pass (live Qloo) |
| 11–12 | Discover + pending disable | Pass |
| 13–14 | Recommendations + evidence expand | Pass (live) |
| 15–16 | Refine / Start over | Pass (control present) |
| 17–19 | Error / empty / timeout | Partial — network error copy covered; empty state UI present; full timeout not forced |
| 20 | Mobile nav | Pass |
| 21 | Official site links | Present `rel=noopener noreferrer` |
| 22 | History | N/A (hash anchors) |
| 23–24 | Console / assets | No app console failures observed during QA session; brand PNGs load |
| 25 | Horizontal overflow @1440 | Pass (`overflowX: false`) |

**Live vs fixture:** Discovery and autocomplete screenshots used **live Qloo** (mode banner “Live taste graph”). No credentials captured in screenshots.

---

## 6. Accessibility & performance

- Focus-visible accent outline retained; combobox roles/listbox added; Escape on menu/search.
- Touch targets ≥ ~44px on primary controls.
- `prefers-reduced-motion` still honored in `globals.css`.
- Contrast: cream/navy and mist-on-ink hero generally AA; mist/55 labels remain decorative secondary text.
- **Lighthouse:** not run this session (no fabricated scores). CLS risk reduced via skeletons matching card layout; LCP candidate is brand background PNG.

---

## 7. Quality gates

| Gate | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npm test` | 22/22 pass |
| `npm run lint` | Pass |
| `npm run build` | Pass |
| `npm audit --omit=dev` | 0 vulnerabilities |

---

## 8. Remaining limitations

- No Playwright suite checked into repo (browser MCP used).
- Category card art is abstract gradients, not venue photography.
- Sticky header invert filter on logo is a pragmatic treatment; true dual-asset logos would be cleaner.
- Key rotation / Vercel deploy still outside this task.
- Auto-deploy risk: if the GitHub repo is already linked to Vercel, pushing `main` may trigger a production deploy — this task does not intentionally invoke Vercel CLI.

---

## 9. Final visual assessment

The interface is **substantially more editorial and Figma-adjacent** than the baseline: artistic hero, consumer language, recommendation-first results, and judge-ready disclosures. Suitable to present to international hackathon judges for visual/UX quality, with the remaining blockers being ops (key rotation, hosting), not primary visual polish.

## 10. Taste Journey follow-up (2026-10-30)

Added guided steps + AffinityConnections visualization (live Insights affinities clickable → highlight places). Evidence strength badges on cards. See `GUIDED_DEMO.md` and `QLOO_VALUE_VALIDATION.md`. Hero/branding preserved (not a second redesign).
