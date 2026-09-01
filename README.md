# SoleSignal

SoleSignal is an India-first footwear market-intelligence product. It turns append-only product observations into explainable trend, saturation, opportunity, and confidence scores. It never labels estimated demand as unit sales.

The application is MIT-licensed and uses open-source code throughout: Next.js, React, Convex, Convex Auth, Crawlee, Apify SDK, Zod, Vitest, and Playwright. Convex can be self-hosted; its managed service and Apify/Vercel hosting are optional.

## What is included

- GitHub-only authentication and private workspace membership checks
- India footwear taxonomy, normalisation, exact matching, and style clustering
- Idempotent CSV ingestion with browser-side row errors
- Append-only price, rank, review, size, and availability history
- Inspectable Trend, Saturation, Opportunity, and Confidence scores
- Dashboard, trend explorer, products, opportunities, competitors, research, catalog, alerts, sources, settings, and weekly report screens
- Five permissioned live India catalogs: Campus Shoes, The CAI Store, Neeman's, RedTape, and INC.5
- Formal-first coverage: 75% of each UCP source request prioritises Oxfords, Derbies, Brogues, Monk straps, Moccasins, Loafers, pumps, and other office footwear
- Real prices, list prices, images, stock, and sizes synced into the signed-in Convex workspace
- Daily 06:00 IST collection through a Convex cron, with same-day duplicate protection
- Honest 7, 30, 90, and 180-day product windows that remain blank until enough real history exists
- A disabled Flipkart adapter and configurable retailer adapter for approved feeds
- Printable weekly report and CSV export
- Disabled-by-default model and WhatsApp provider interfaces
- Synthetic demo seed, clearly separated and labelled

## Local setup

Requirements: Node.js 22+, pnpm 10+, and a Convex account or self-hosted Convex deployment.

```bash
pnpm install
cp .env.example .env.local
pnpm exec convex dev
pnpm dev
```

`pnpm exec convex dev` links or creates the backend, writes the three local Convex variables, deploys functions, and watches them. In a second terminal, `pnpm dev` starts the website.

Seed the reproducible demo once:

```bash
pnpm exec convex run seed:seedDemo '{}'
pnpm exec convex run seed:activateCaiSource '{}'
pnpm exec convex run seed:seedPlannedSources '{}'
```

## GitHub login

Create a GitHub OAuth App. For local development use:

- Homepage URL: `http://localhost:3000`
- Callback URL: `https://YOUR-CONVEX-DEPLOYMENT.convex.site/api/auth/callback/github`

Set the secrets on the Convex deployment, where server code can read them:

```bash
pnpm exec convex env set AUTH_GITHUB_ID 'your-client-id'
pnpm exec convex env set AUTH_GITHUB_SECRET 'your-client-secret'
pnpm exec convex env set SITE_URL 'http://localhost:3000'
```

Do not put the GitHub secret in a `NEXT_PUBLIC_` variable or commit it. The current development callback is documented in `STATUS.md`.

## Collector

Run the compliant collector smoke tests:

```bash
pnpm --filter @solesignal/collector test
pnpm --filter @solesignal/collector start -- --source cai-store-public
pnpm --filter @solesignal/collector start -- --source campus-ucp
```

The Catalog screen syncs all five approved live sources into a private
workspace. Repeating a source sync on the same UTC day is idempotent: current
rows are reported as duplicates instead of inflating the observation count.

Production also runs `dailyPipeline:syncDaily` every day at 00:30 UTC (06:00
IST). UCP collection requests formal shoes first, then fills the remaining
coverage with broader footwear for comparison. A trend window needs at least 70% of its requested calendar history before
it publishes a score. Until then the UI reports the exact observed-day count
instead of extrapolating or filling gaps with synthetic data.

The Flipkart adapter reports `Not connected` until its ID, token, and confirmed endpoint are supplied. Build the standalone Apify Actor from its directory:

```bash
cd apps/collector
docker build -t solesignal-collector .
```

## Quality checks

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
pnpm --filter @solesignal/collector typecheck
pnpm --filter @solesignal/collector test
```

To reuse an already running local server for browser tests:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3000 pnpm test:e2e
```

## Deployment

1. Create a production Convex deployment with `pnpm exec convex deploy`.
2. Set production `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, and `SITE_URL` on that deployment.
3. Add the production Convex callback URL to the GitHub OAuth App.
4. Deploy the Next.js project to Vercel with the production `NEXT_PUBLIC_CONVEX_URL` and `NEXT_PUBLIC_CONVEX_SITE_URL`.
5. Convex deploys the daily collector schedule from `convex/crons.ts`; Apify remains available for approved sources that require browser collection.
6. Keep every planned connector disabled until permission, fixtures, and a live smoke test pass.

See `RUNBOOK.md` for operations, `DATA_SOURCE_MATRIX.md` for connector truth, and `COMPLIANCE_AND_SOURCE_POLICY.md` for collection rules.
