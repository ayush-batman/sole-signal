# SoleSignal Runbook

## Local start

1. Install Node 22+, pnpm, and dependencies with `pnpm install`.
2. Copy `.env.example` to `.env.local`.
3. Run `pnpm convex:dev` and `pnpm dev` in separate terminals.
4. Open the printed Next.js URL.

GitHub login requires a GitHub OAuth app plus Convex Auth deployment keys. Without them the connector is visibly `Not configured`; demo exploration and CSV validation remain available locally.

## Routine checks

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`

## Collector

Run `pnpm --filter @solesignal/collector test`, then `pnpm --filter @solesignal/collector start -- --source <id>`. A source must pass fixture, robots, throttling, and schema checks before scheduling.

## Incident handling

- Stale/degraded source: inspect the latest crawl and health event, disable publishing, run fixture tests, then smoke test one permitted category.
- Score anomaly: inspect stored component values and score version; never overwrite historical scores.
- Duplicate import: confirm idempotency key fields and report skipped rows.
- Auth failure: verify GitHub callback URL and per-deployment Convex Auth variables; do not expose secrets in the browser.

## Deployment

Deploy the Next.js app to Vercel and Convex functions to the production Convex deployment. Set production GitHub callback and every variable again; development secrets do not carry over. Schedule the collector on Apify, not Vercel.
