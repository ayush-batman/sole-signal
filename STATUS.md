# SoleSignal Status

Last updated: 2026-09-01

## Completed

- Preserved the unrelated parent repository and built SoleSignal in `sole-signal/`.
- Added the ten requested product, architecture, data, scoring, quality, compliance, roadmap, operations, and status documents.
- Built the pnpm TypeScript workspace with Next.js, Convex, a shared domain package, and a standalone Crawlee/Apify collector.
- Wired GitHub as the only login provider. Added authenticated workspace onboarding and membership checks around every private mutation/query.
- Created the normalized Convex schema, indexes, append-only snapshots, raw payload retention, observed/ingested timestamps, and versioned scores.
- Added browser-side CSV validation, understandable row errors, a template, private import, idempotency, and duplicate reporting.
- Implemented the India footwear taxonomy, aliases, normalization, exact matching, style compatibility, scoring, and provider interfaces.
- Seeded six reproducible synthetic histories, 12 products, 72 observations, evidence, scores, and recommendations. Every demo surface is visibly labelled.
- Built all requested application routes, responsive navigation, light/dark/system themes, dashboard filters, reports, source health, and structured research answers.
- Implemented the live CAI Store public-catalog collector after robots and `agents.md` checks. Live category discovery and five observations pass.
- Implemented disabled Flipkart and planned retailer connectors that fail without pretending to be live.
- Added an MIT license, complete README, full environment template, Apify Dockerfile, Playwright browser suite, and Convex integration tests.
- Registered the development GitHub OAuth app, configured its credentials only in Convex, and completed the real authorization flow as `ayush-batman`.
- Completed signed-in onboarding for `SoleSignal Workspace` and verified private CSV ingestion against the live Convex development deployment.
- Updated Convex Auth and Auth.js to current compatible releases, including Auth.js 0.41.3's OAuth security fix and GitHub's current issuer response support.
- Published SoleSignal's public UCP agent profile from Convex and added permissioned live catalog sync for Campus Shoes, Neeman's, RedTape, and INC.5.
- Connected the signed-in workspace to live data instead of forcing authenticated users onto the demo workspace.
- Synced and browser-verified 121 listings: 24 each from five live stores plus the existing private CSV observation, with 120 real catalog images.
- Added same-day duplicate protection to every live sync and verified repeated Campus and CAI syncs return `0 added · 24 already current`.
- Replaced placeholder artwork with actual catalog images when a source supplies one; missing trend stages now read `insufficient history` instead of `stable`.
- Deployed a daily 06:00 IST production collector for all five approved catalogs, using internal-only ingestion and per-day duplicate protection.
- Added evidence-based 7-day, 30-day, 90-day, and 180-day product trend windows. Scores remain blank until at least 70% of a window contains real observed history.
- Ran the scheduled pipeline against development and production: 10 source-workspace runs per environment, zero source failures, and 1,000 fresh observations per environment.
- Published the public GitHub repository and production Vercel/Convex deployments.
- Added the production callback to the GitHub OAuth app and completed the live authorization flow as `ayush-batman`.
- Browser-verified the production dashboard and product catalog: 621 live snapshots, 472 observed listings, six sources, and working 7-day, 30-day, 90-day, and 180-day views with no console errors.

## Blocked on user input

- The five public live catalogs are complete and working.
- Flipkart needs an approved affiliate ID and token.
- Amazon India needs approved Creators API OAuth credentials and a partner tag.
- Myntra, AJIO, Tata CLiQ, and Meesho need partner-feed access because no approved public product API is available.

## Decisions made

- Convex replaces Supabase at the user's request. Convex membership checks are the row-isolation boundary and are covered by integration tests.
- GitHub is the only identity provider.
- All application code and dependencies are open source; hosted Convex, Vercel, and Apify are optional services.
- Public demo exploration stays read-only; private imports require a signed-in workspace.
- AI/model enrichment and WhatsApp delivery are provider interfaces and remain disabled rather than inventing results or requiring a closed provider.
- Collection uses approved APIs, feeds, or explicitly permitted public structured data only.

## Verification passing

- TypeScript: root and collector type checks pass.
- Lint: no errors or warnings.
- Unit/integration: 21 tests cover scoring scenarios, four-window history gates, low-inventory and discount false positives, taxonomy, normalization, matching, CSV, live-source fixtures, ingestion idempotency, and cross-workspace rejection.
- Browser: 7 Playwright checks pass across desktop and phone; one desktop-only duplicate of the phone navigation test is intentionally skipped.
- Real authentication: GitHub authorization returns to `http://localhost:3000`, the session survives a production rebuild/restart, and authenticated UI shows `Sign out`.
- Production authentication: GitHub authorization returns to `https://sole-signal-nu.vercel.app/dashboard`; the private dashboard and catalog load for `ayush-batman`.
- Private workspace: signed-in onboarding created `SoleSignal Workspace` with the configured India footwear decision profile.
- Private import: the fixture produced `1 inserted · 0 duplicates safely skipped`; repeating the exact import produced `0 inserted · 1 duplicates safely skipped`.
- Accessibility: dashboard, CSV catalog, and trend evidence pages have zero WCAG A/AA axe violations.
- Browser console: no uncaught errors across the main dashboard, import, and trend-evidence journey.
- Production build: all 15 routes compile successfully.
- Live sources: Campus collector smoke test passes; Campus, CAI, Neeman's, RedTape, and INC.5 all sync into Convex through explicit read-only public catalog access.
- Live browser data: 121 listings, five public store feeds plus one private CSV source, and 120 real product images render in the signed-in workspace.
- Scheduled production collection: 1,000 observations inserted across two non-demo workspaces from ten successful source-workspace runs; zero failures.
- Live production browser: all four trend-window controls render the correct selected range and no browser console errors were reported.

## Commands run

- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`
- `PLAYWRIGHT_BASE_URL=http://localhost:3000 pnpm test:e2e`
- `pnpm --filter @solesignal/collector typecheck`
- `pnpm --filter @solesignal/collector test`
- `pnpm --filter @solesignal/collector start -- --source cai-store-public`
- `pnpm exec convex dev --once` and the three seed mutations
- Desktop/phone visual, console, interaction, and accessibility checks

## Optional future work

- Configure approved marketplace feeds, a model provider, WhatsApp, and a custom domain if those integrations become useful.
- The collector Dockerfile is structurally checked but was not built locally because this machine has no running Docker daemon.
