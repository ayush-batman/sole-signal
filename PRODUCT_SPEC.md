# SoleSignal Product Specification

## Product promise

SoleSignal turns timestamped footwear listings into evidence-backed decisions for Indian manufacturers, wholesalers, retailers, marketplace sellers, and D2C teams. It never labels estimated demand as sales and never publishes a recommendation without observations, dates, source links, and confidence.

## First complete vertical slice

The first release covers GitHub sign-in, workspace onboarding, validated CSV observation import, idempotent append-only history, footwear classification, exact matching, style clustering, inspectable trend/opportunity/confidence scores, dashboard and trend exploration, product evidence, source health, alerts, weekly report, and a constrained research interface. Synthetic seed histories are always labelled **Demo data**.

## Core users and decisions

| User | Main decision |
| --- | --- |
| Manufacturer | manufacture, sample, or avoid a style |
| Wholesaler | source, reorder, or discount stock |
| Retailer | adjust assortment, price, and depth |
| Marketplace seller | test listings and watch competitors |
| D2C operator | prioritize product and campaign concepts |

## Trust contract

- Demand is described as estimated unless a connected first-party source supplies units.
- One observation is never enough to claim acceleration.
- Demand and supply signals are shown separately.
- Every score exposes its version, input components, observation window, and limitations.
- Connectors are disabled until both access and compliance checks pass.
- Workspace membership is checked inside every protected Convex function.

## MVP journeys

1. Sign in with GitHub, create a workspace, and set price bands, categories, margin, MOQ, lead time, and risk tolerance.
2. Download the CSV template, import observations, resolve row errors, and safely re-import the same file.
3. Explore rising, peaking, declining, discount-led, and insufficient-history clusters.
4. Open a product to inspect price, rank, reviews, availability, attributes, matches, cluster, and source evidence.
5. Ask a supported research question; receive structured findings, filters, assumptions, confidence, and evidence cards.
6. Configure an alert and print or export the weekly report.

## Non-goals for the first slice

- Claiming actual marketplace unit sales without an explicit source field.
- Circumventing CAPTCHAs, logins, robots rules, or rate limits.
- Fully automated manufacturing commitments.
- Activating planned marketplaces before approved access and fixture-backed extraction exist.

## Acceptance

The detailed acceptance list from the brief is tracked in `STATUS.md`. A criterion is marked verified only after its automated or browser check passes.
