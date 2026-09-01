# Data Quality

## Metrics per source run

Fetch success, product extraction, null rate by field, freshness lag, duplicate rate, rank coverage, image coverage, review coverage, availability coverage, response status, parser version, and schema drift are recorded for every run.

## Publication gates

- Extraction success below 90%: degraded.
- Required-field null rate above 10%: degraded.
- Freshness beyond twice the configured interval: stale.
- Parser fixture failure or structural drift: blocked.
- Fewer than three observations over seven days: insufficient history.

Degraded sources receive a confidence penalty. Blocked sources cannot produce new published recommendations. Existing findings remain visible with a warning and last-good timestamp.

## Ingestion quality

CSV rows return a row number, field, supplied value, and plain-language correction. Valid rows can be previewed before commit. File size, row count, URL scheme, currency, finite numbers, dates, rank context, and duplicate idempotency keys are checked.

## Testing

Every live connector has a sanitized fixture and parser test. Synthetic score timelines cover organic growth, discount-led movement, temporary stock-out, low-inventory false positives, saturation, cross-platform agreement, decline, and insufficient history.
