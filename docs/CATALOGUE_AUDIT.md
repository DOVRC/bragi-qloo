# Catalogue audit — Medellín cultural records

**Date:** 2026-10-30  
**Branch:** `feature/final-impact-sprint`  
**Rule:** Prefer fewer correct Medellín records over inaccurate national matches.

## Critical correction

| Entry | Prior claim | Finding | Action |
| --- | --- | --- | --- |
| Odio a Botero | Medellín alternative / art-rock | Señal Colombia and Idartes describe a **Bogotá** hardcore/punk band (formed ~2001). | **Removed** from Medellín catalogue. |

Sources:
- https://www.senalcolombia.tv/documental/punk-hecho-en-colombia
- https://www.idartes.gov.co/es/noticias/odio-botero-ruidosa-demencia-capitalina

## Retained venues / programs

| ID | Kind | City | Public URL | Notes |
| --- | --- | --- | --- | --- |
| mamm-medellin | venue | Medellín | mamm.org.co | No Qloo place id (Search mis-resolves). Hooks cleaned of celebrity name-drops. |
| teatro-pablo-tobon | venue | Medellín | teatropablotobon.com | Verified Qloo place id. |
| casa-de-la-musica | venue | Medellín | udea.edu.co | University program; indicative cost only. |
| teatro-metropolitano | venue | Medellín | teatrometropolitano.com | Verified Qloo place id. |
| comuna13-street-art | venue | Medellín | — | Operator booking required; no invented tickets. |
| museo-casa-memoria | venue | Medellín | museocasadelamemoria.gov.co | Free entry typical. |
| plaza-mayor-conventions-culture | venue | Medellín | plazamayor.com.co | Festival calendar varies. |
| jardin-botanico-events | venue | Medellín | botanicomedellin.org | Path B only. |

## Creators / projects

| ID | Kind | Medellín evidence | URL | Decision |
| --- | --- | --- | --- | --- |
| creator-alcolirykoz | creator | Official site / Aranjuez origin | alcolirykoz.com | Keep |
| creator-ferales | creator | EPK: Origen Medellín, 2019 | feralesmusica.com/epk | **Added** |
| creator-nomada | creator | Bandcamp: Medellín-Colombia | nomadacolombia.bandcamp.com | **Added** |
| creator-tapelooplab | creator | Bandcamp location Medellín | tapelooplab.bandcamp.com | **Added** |
| project-casa-tres-patios | project | Official site Prado | casatrespatios.org | Keep |
| project-centro-cultural-moravia | project | Official Moravia center | centroculturalmoravia.org | Keep |
| project-intermediaciones | project | Official Medellín video showcase | intermediaciones.org | **Added** |
| project-siempre-llueve-recs | project | Bandcamp: DIY label Medellín | siemprellueve.bandcamp.com | **Added** |

## Not added (insufficient Medellín identity)

| Candidate | Reason |
| --- | --- |
| Margarita Siempre Viva | Bandcamp location “Antioquia”; tour stops include Medellín but origin not independently confirmed as Medellín-based for this catalogue. |
| Odio a Botero | Bogotá-origin; out of scope for Medellín product promise. |

## Hook hygiene

Removed celebrity input-artist name stuffing (e.g. “radiohead”, “studio ghibli”, “miles davis”) used only to force demo matches. Hooks now emphasize genres, disciplines, and scene descriptors.

## Demonstration records

Three `demonstration` profiles remain; excluded when `SAMPLE_DATA_MODE` is off / live matching with `includeDemonstration: false`.
