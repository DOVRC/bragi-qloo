# Hackathon requirements (authority: official rules)

Primary sources:
- https://qloo.devpost.com/rules
- https://qloo.devpost.com/ (What to Submit)
- Starter kit [`SUBMISSION.md`](https://github.com/qloo/qloo-hackathon-kit/blob/main/docs/SUBMISSION.md)

If this document conflicts with the official rules page, **follow the official rules** and note the discrepancy here.

## Project requirements

| Requirement | Source | Our approach |
| --- | --- | --- |
| Working software integrating Qloo API | Rules §4 | Server-side Insights + Search |
| Agentic tool / agent framework / wire into existing agent | Rules §4 | `DiscoveryAgent` multi-step orchestrator with Qloo tools |
| Capable of running as depicted | Rules | Next.js deployable demo |
| New or significantly updated during submission period | Rules | Taste Agent is new work on existing Bragi repo; document delta |

## Submission requirements

| Requirement | Status |
| --- | --- |
| Link to functional **externally hosted** demo | Pending deploy authorization |
| Public GitHub/GitLab/Bitbucket URL | Repo exists (private changes on local branch until push) |
| Open-source **license file** visible in About | **Missing** on baseline — add after ownership confirmation |
| English text description | Pending |
| Setup & testing instructions | Partial (`apps/taste-agent` README) |
| All materials in English (or English translations) | Docs in English |

### Discrepancy notes

1. **Prompt vs rules — video:** Official “What to Submit” states demo videos are **not required**; a live hosted demo is. Checklist treats video as optional.
2. **Prompt vs rules — “substantial changes”:** Rules require explaining significant updates if project pre-existed. We document original ICP vs new Taste Agent in submission materials.
3. **External hosting:** Rules require fully published external hosting (not local-only). Deployment is a P0 blocker pending authorization.

## Judging criteria (equal weight)

1. Technological Implementation — depth of Qloo use; non-trivial working code  
2. Design — coherent product experience  
3. Potential Impact — real audience + problem fit  
4. Quality of the Idea — creative, non-obvious Qloo use  

## Eligibility reminder

Colombia-based team is eligible (not in excluded territories). Team Representative must submit on Devpost.

## Checklist

See [`SUBMISSION_CHECKLIST.md`](SUBMISSION_CHECKLIST.md).
