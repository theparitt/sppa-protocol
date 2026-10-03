# Invocation and job lifecycle

## Admission

`POST /v1/jobs` carries `job.create` and an idempotency key. Authenticate the
caller, validate the full envelope and parameter schema, resolve an owned/live
input artifact, enforce policy/constraints/permissions/health, and verify the
absolute deadline. Admission and deduplication MUST be atomic.

Accepted asynchronous work returns HTTP 202 with type `job.created` and a
queued job. A capability advertising synchronous request/response MAY return
HTTP 200 with a completed job and receipt; it MUST finish within the request's
execution deadline. Core's reference provider advertises async jobs only.

A rejected invocation MUST NOT begin capability execution or produce a success
receipt. Admission MUST bound queue size, request bytes, artifact size,
concurrency and execution duration. Deadline exceeding provider limits is a
constraint error, not permission to silently drop the limit.

## States and transitions

| Current | Allowed next states |
| --- | --- |
| queued | running, failed, canceled, expired |
| running | completed, failed, canceled, expired |
| completed | none |
| failed | none |
| canceled | none |
| expired | none |

`created` and `awaiting_input` are not exposed in this initial profile: input
is committed before job admission. Preview/revision/finalizing states belong
to later extensions. A completed job includes start/finish timestamps, output
artifact, result metadata, progress 1 and receipt ID. Failed/expired jobs include
a structured error and finish timestamp. Cancellation includes finish timestamp.

Status timestamps MUST be ordered; result metadata MUST pass the capability's
result schema. An output's ownership/privacy cannot be weaker than the request.
Providers MUST commit output and receipt before exposing `completed`.
No terminal state can later become another terminal state, even after a worker
callback or delayed message arrives.

## Observation and cancellation

`POST /v1/jobs/get` with `job.get` returns `job.snapshot`.
Only the job owner or an explicitly authorized delegate can observe it.
Progress is optional, bounded 0-1, and is not evidence of success.

`POST /v1/jobs/cancel` with `job.cancel` returns `job.snapshot`.
Cancellation of queued/running work attempts a transition to `canceled` and
stops further work. Cancellation of terminal work returns that terminal snapshot
without mutation. If completion wins the atomic race first, cancellation may
observe `completed`; it MUST NOT rewrite it. If cancellation wins first, a later
worker success MUST NOT publish output/receipt as a completed job.

Absolute deadline exhaustion transitions to `expired`, stops work, and discards
uncommitted output. Capacity exhaustion is distinct from execution failure.

## Idempotency

Keys are scoped to the authenticated caller at a provider, independent of
`request_id`. The semantic digest is RFC 8785 canonical JSON of `{type, payload}`.
Fresh attempt timestamps and request IDs do not change the logical job.
The same key and digest return the same job ID/current snapshot. Reusing a key
with another operation/payload returns `idempotency_conflict` (409).

Providers MUST retain the dedup record for at least 24 hours after admission,
including terminal jobs, across process restarts. Concurrent identical creates
MUST allocate one job. Clients retry an uncertain network result with the same
key and identical payload, not a new key. Resource expiry can still make the
input/output artifact inaccessible; a dedup snapshot is not renewed retention.

The reference uses in-memory state and demonstrates this within one process;
it is not conformant with restart durability and must not be marketed as such.
Production storage must make dedup/job admission transactional.

## Explicit retry

`POST /v1/jobs/retry` with `job.retry`, original job ID, new deadline and a new
idempotency key creates a new job only from failed/canceled/expired work.
It preserves original input/parameters/policy and records `retry_of`.
The original job never changes. Input, authorization and eligibility are
checked again; expired input requires a new committed artifact/new create.
Duplicate retry attempts use the same new key and return the same new job.
Completed work cannot be retried through this operation.
