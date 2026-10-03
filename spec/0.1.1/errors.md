# Errors and monitoring

Errors use envelope type `error`. Payload fields are `code`, readable `message`,
boolean `retryable`, optional structured `details`, `suggested_action` and
`retry_after_ms`. The latter is an evidence-based millisecond backoff hint;
when present, HTTP Retry-After rounds it up to whole seconds.
Messages are explanatory; automation branches on stable codes. Do not expose
raw stderr, paths, credentials or another principal's data.

| HTTP | Codes / meaning |
| --- | --- |
| 400 | invalid_request, unsupported_version, unsupported_operation |
| 401 | unauthenticated |
| 403 | forbidden |
| 404 | not_found (also hides unowned resources) |
| 409 | idempotency_conflict, state_conflict |
| 410 | transfer_expired |
| 422 | constraint_violation, policy_violation, integrity_mismatch, deadline_exceeded, retry_exhausted |
| 429 | rate_limited, queue_full, capacity_exhausted |
| 500 | internal_error |
| 503 | provider_unavailable |

`execution_failed` is normally a job's terminal error in an otherwise valid
job snapshot, not proof that a control request failed. Integrity/policy/schema
errors are not fixed by blind retries. Transient capacity/unavailability MAY
be retryable, ideally with a bounded backoff hint. Retrying a create after a
network timeout MUST use the original idempotency key and identical payload.

## Monitoring document

`POST /v1/health` with `health.get` returns `health.snapshot` including provider
identity, healthy/degraded/unavailable status, observed_at, valid_until,
queue_depth, active_jobs, max_concurrency and source.
It also includes a unique observation for each reported capability/version,
with execution slots, available slots, waiting depth and capacity admission state.
Operational health remains separate from saturation; a healthy busy provider can
still queue work. Public observations do not expose individual caller rate buckets.

Clients MUST check timestamps and identity, not just a green status string.
Expired observations are unknown/unusable. Provider-reported observations and
synthetic measurements MUST be labeled distinctly. No success-rate or latency
statistic may be invented from absent observations. A synthetic test is actual
execution and must respect authorization, costs and side effects.

Monitoring is not a background telemetry mandate: private/local providers can
expose health to authorized callers without sending data to a public Hub.
