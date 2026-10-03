# Capacity and admission

## Provider-owned contracts

Every capability MUST declare its own `execution` contract. A provider can offer
many capabilities with different concurrency, queue, rate, timeout and retry
limits. A registry or Hub indexes these declarations and fresh observations;
the provider has final authority to accept, queue or reject work. A search result
does not reserve a slot or authorize execution.

```json
{
  "max_concurrency": 2,
  "queue": { "enabled": true, "max_depth": 64, "policy": "fifo" },
  "rate_limit": { "requests": 120, "window_seconds": 60, "scope": "caller" },
  "timeout_seconds": 60,
  "retry": { "supported": true, "max_attempts": 3 }
}
```

These fields are part of the capability contract. Core 0.1.1 consolidates timeout
and concurrency here, replacing the duplicated 0.1.0 constraint fields. The two
wire versions require exact negotiation; old documents must not be silently
interpreted as 0.1.1. Original 0.1.0 resources remain available.

## Declared limits

`max_concurrency` is the maximum executing work for this capability/version.
`queue.max_depth` counts waiting work, excluding executing jobs. A disabled
queue declares zero depth. This binding specifies FIFO only: queued jobs start
in admission order as execution slots are released. Priority, resource-unit
quotas and shared GPU scheduling need separately specified profiles; this draft
does not advertise them as implemented.

`rate_limit` limits **newly admitted logical jobs**, including explicit retries,
per authenticated caller at this capability/version. In any rolling interval
of `window_seconds`, at most `requests` such jobs may be admitted. Reads, failed
admissions and successful idempotency replays do not consume this budget.
Two capabilities and two callers have separate buckets. Providers MAY impose
additional documented deployment/resource limits, reported honestly as rejection.

Timeout and rolling-window values are integer seconds from 1 through 31,536,000
in this binding; milliseconds are used only for wait/backoff hints.

`timeout_seconds` bounds total time from admission through queueing and execution.
The caller's absolute deadline must fit within that interval. Time in a queue
does not renew a deadline. A canceled/expired worker still occupies execution
capacity until it has actually stopped and released its resources.

`retry.max_attempts` includes the initial job and all newly admitted retries in
its root lineage. Duplicate retries count once. Retrying an earlier ancestor
with fresh keys MUST NOT reset the shared attempt budget. Disabled retry declares
one attempt. Providers MUST report `attempt` and `root_job_id` on job snapshots.
Original jobs remain immutable; retries still recheck policy, input and rights.

## Runtime observations

Health snapshots MUST include distinct capability/version observations:

```json
{
  "capability": "video.transcode",
  "capability_version": "1.0.0",
  "accepting_jobs": true,
  "capacity": { "max_concurrency": 2, "running": 2, "available": 0 },
  "queue": { "depth": 7, "max_depth": 64 }
}
```

The enclosing document binds provider identity, source and freshness timestamps.
`available` equals declared concurrency minus running work. Queue depth MUST
exclude canceled/expired waiting jobs and remain within declared depth.
`accepting_jobs` describes capacity admission: true if an execution slot is free,
or the enabled queue has room. It does not promise that a particular caller's
policy, permissions, rate budget or deadline will pass admission.

Operational health and saturation are separate. A healthy provider can have no
free execution slots while still accepting queued work. Degraded observations
require inspection; unavailable/stale observations cannot establish availability.
Do not report saturation as an outage or silently reject all busy providers.

`estimated_wait_ms` is optional. Omission means unknown, not zero. Providers MUST
base an estimate on actual observations and label their estimation limitations.
The reference omits estimates because it has no calibrated wait model. A registry
may rank fresh load/wait evidence alongside separate reputation dimensions;
hard policy and format constraints still come first. Caller AI chooses the provider.

## Atomic final admission and backpressure

Authenticate, validate and check rights/policy before admission. Look up scoped
idempotency first; an identical retry of an admitted request returns its existing
job even if the provider is now full or the caller's rate budget is exhausted.
Then check deadline, lineage attempt budget, rolling caller rate and live capacity.
Job allocation, queue/slot reservation, attempt/rate accounting and deduplication
MUST commit atomically. Rejected work MUST allocate no job and consume no attempt.
Production requires coordinated admission across replicas and durable lineage,
rate and dedup records; the in-memory reference only demonstrates one process.

When all slots are occupied, an enabled nonfull queue accepts work; a full queue
returns `queue_full` (429). A disabled queue returns `capacity_exhausted` (429).
Rate exhaustion returns `rate_limited` (429); exhausted lineage attempts return
`retry_exhausted` (422, not retryable). Errors carry `retryable` and MAY include
integer `retry_after_ms` when there is evidence for that delay. If present, HTTP
`Retry-After` is the delay rounded up to whole seconds. Do not invent an ETA for
queue exhaustion. Backoff hints are lower-bound guidance, not slot reservations.

Clients retain the idempotency key and unchanged payload when an admission result
is uncertain, use bounded backoff/jitter, and stop when a deadline or retry budget
is exhausted. The reference client exposes the hint without automatically
resubmitting jobs or causing additional side effects.
