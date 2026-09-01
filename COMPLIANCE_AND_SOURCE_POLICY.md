# Compliance and Source Policy

## Allowed collection order

1. Approved official or affiliate API.
2. Licensed feed supplied by the user.
3. Public structured data where terms and robots rules allow automated access.
4. User-provided CSV.

## Prohibited behavior

SoleSignal does not bypass CAPTCHAs, authentication walls, access controls, rate limits, paywalls, or bot defenses; rotate identities to evade controls; scrape personal data; or pretend a blocked connector is active.

## Activation review

Each source requires a dated record of terms review, robots result, permitted paths, request frequency, contact/user-agent, data fields, retention restrictions, fixture permission, and owner approval. A runtime robots denial stops the run. A terms change moves the connector to `review_required`.

## Evidence and deletion

Observations retain the source URL, source product ID, observed and ingested timestamps, locale/geo context, raw fields, and parser version. Removal requests can suppress display while preserving a minimal audit record where legally permitted.

## Responsibility

The software is open source; operators remain responsible for source contracts, local law, and their collection configuration. The default configuration is conservative and inactive for unreviewed marketplaces.
