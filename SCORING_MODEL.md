# Scoring Model

## Principles

Scores range from 0–100, are versioned, and are normalised within source, market, category, and observation date. They estimate signals, not unit sales. Robust percentile scaling and median absolute deviation reduce outlier effects.

## Trend score v1

| Component | Weight |
| --- | ---: |
| Rank momentum | 25% |
| Current rank strength | 20% |
| Log review velocity | 15% |
| Availability pressure | 15% |
| Cross-source breadth | 10% |
| Search momentum | 10% |
| Price resilience | 5% |

At least three observations across seven elapsed days are required for a scored trend. Otherwise the stage is `insufficient_history`. Rank is first converted to percentile inside its surface size. A temporary stock-out cannot by itself create growth. Discount-led movement applies a configurable penalty based on discount-depth change and signal disagreement.

## Supply saturation v1

- Similar-listing growth 40%
- Competing-brand count 25%
- Deep-discount share 20%
- Similar-product density 15%

## Opportunity v1

- Trend score 45%
- Demand-supply whitespace 20%
- Margin fit 15%
- Supplier lead-time fit 10%
- Catalogue/customer fit 10%

## Confidence v1

Confidence combines source reliability, independent-source count, observation coverage, matching confidence, attribute confidence, extraction health, and signal agreement. Missing signals lower confidence rather than being treated as zero demand.

## Stages

- Emerging: positive acceleration from a low/moderate base.
- Rising: sustained positive momentum.
- Peaking: strong current signal with slowing acceleration.
- Declining: sustained negative momentum.
- Discount-led: movement materially explained by deeper discounting.
- Insufficient history: coverage threshold not met.

## Reproducibility

Every result stores score version, configured weights, raw component values, normalised component values, penalties, input observation IDs, computed time, and confidence notes. Workspace/category overrides are copied into each result.
