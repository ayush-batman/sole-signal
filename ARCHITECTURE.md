# SoleSignal Architecture

## Repository audit

The parent repository contains an unrelated static/Python product named LeadFold plus personal scripts and uncommitted files. SoleSignal is isolated in `sole-signal/`; no parent files are replaced or deleted.

## System shape

SoleSignal is an open-source pnpm TypeScript workspace:

- Next.js App Router web application for server-rendered and interactive product screens.
- Convex for typed data, reactive queries, transactions, scheduled work, file storage, search, and GitHub authentication.
- `packages/domain` for Zod taxonomy, normalisation, matching, clustering, scoring, and CSV contracts.
- `apps/collector` for Crawlee-based, robots-aware source adapters deployable to Apify.

Convex replaces the originally proposed Supabase layer at the user's direction. Workspace isolation is implemented through a shared authenticated-function wrapper: it resolves the authenticated identity, confirms membership, and injects the workspace into handlers. This is the Convex equivalent of row-level access control.

## Data flow

1. A CSV or approved adapter emits a source observation.
2. Domain validation normalises currency, title, rank context, sizes, and raw fields.
3. An idempotency key combines workspace, source, source product ID, market, and observed time.
4. A mutation upserts source/listing identity and inserts an immutable snapshot only when the key is new.
5. Attribute extraction runs only for new or materially changed products and stores method/model/prompt/confidence.
6. Matching and style clustering run independently.
7. Versioned scoring consumes historical observations and creates component-level evidence.
8. Reactive queries feed dashboards, timelines, reports, alerts, and constrained research tools.

## Boundaries

- Browser: display and user input; never receives provider secrets.
- Convex queries/mutations: authenticated data access and transactions.
- Convex actions: model providers, notifications, and remote calls.
- Collector: scheduled crawling outside Vercel; no production crawler runs as a web function.

## Global expansion

Country, currency, locale, timezone, geo context, price bands, taxonomy extensions, source-market mapping, and scoring configuration are data, not hard-coded branching. India ships first with INR and Indian footwear vocabulary.

## Security

- GitHub OAuth through Convex Auth; no local password store.
- Protected functions require identity and workspace membership.
- Connector and model secrets exist only as environment variables.
- CSV input has byte, row, type, URL, date, and enum validation.
- Research exposes named read-only tools rather than arbitrary database queries.
