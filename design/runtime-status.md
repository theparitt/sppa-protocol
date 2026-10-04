# Runtime Status & Capacity

**Experimental profile 0.1.0-draft.1 · 2026-10-04. Snapshot and receiver checks implemented; native heartbeat publishing and subscriptions not implemented.**

Agents need to know what a provider can do and whether it is a suitable candidate
now. This extends Execution & Admission (S05), feeding Decision & Offer (S04) and
Registry & Discovery (S08). Optional live delivery belongs to Streams &
Subscriptions (X02). These are design module labels, not additional released APIs.
SPPA defines the meaning; the chosen binding carries the observations.

## Five separate questions

| Dimension | Meaning |
| --- | --- |
| Reachability | An endpoint responded from this observer's network path: reachable, unreachable, unknown |
| Scoped liveness | A named endpoint, worker pool or execution responded recently |
| Service health | healthy, degraded, unavailable, unknown; a responsive API does not establish healthy GPU workers |
| Admission | accepting, queue_only, rejecting, unknown; a healthy busy provider may still queue work |
| Execution progress | Authorized caller-private job state, independent of public load and endpoint heartbeat |

Missing or hidden values mean unknown, not zero. No percentage is inferred from
elapsed time. An endpoint heartbeat cannot reset a stalled job's progress deadline.

## Compatibility and published contracts

Core 0.1.1 already provides `health.get`, fresh health/capability snapshots and
atomic admission. Its exact messages, schemas and API remain unchanged. This
separate experimental profile is not a Core `health.snapshot` payload. A changing
queue does not change a capability contract's version.

- [Runtime snapshot schema](/sppa-protocol/schemas/runtime-status/0.1.0-draft.1/snapshot.schema.json)
- [Scoped heartbeat observation schema](/sppa-protocol/schemas/runtime-status/0.1.0-draft.1/heartbeat.schema.json)
- [Queue-only example](/sppa-protocol/examples/runtime-status/queue-only.json)

## Snapshot and source boundaries

A full snapshot binds provider/capability/version, publisher identity, epoch,
sequence, source, observation, receipt and expiry times. Receivers MUST authenticate
and authorize the publisher; JSON identifiers alone are not identity evidence.
Provider reports and observer probes remain distinct. A signed claim is not an
independent quality measurement.

`received_at` is receiver-local metadata. A relay preserves original observation
and expiry, and records its own receipt separately. It MUST NOT refresh an old
observation by relaying it. The Core adapter publishes its own observer epoch and
sequence; it cannot infer the provider's restart epoch from Core 0.1.1.

Capacity contains maximum concurrency, running jobs, available slots, waiting
jobs, maximum waiting jobs, queue enablement and FIFO policy. Available equals
maximum minus running. Waiting excludes executing jobs. A disabled queue has zero
depth and maximum depth. Do not reveal private jobs or caller rate buckets.

`accepting` requires measured free execution capacity. `queue_only` requires no
free execution slot and room in an enabled queue. `rejecting` can reflect service
maintenance despite free slots. Unavailable or unreachable observations cannot
advertise positive admission. Hidden capacity is `null` with an explicit reason;
this initial profile returns unknown admission until scoped evidence resolves it.

## Freshness and missing data

Validity is bounded to 60 seconds; the reference receiver defaults to a stricter
15-second maximum age. At expiry an observation becomes unknown. Future dates,
receipt preceding observation, and other clock uncertainty require refresh. This
prototype assumes synchronized UTC clocks; production needs negotiated clock
uncertainty and monotonic expiry across wall-clock changes and suspend/resume.

A failed probe does not create a fabricated healthy or offline snapshot. Preserve
the last sample until its original expiry. A timeout describes that observer's
path, not global provider failure. Denied credentials, invalid data and inaccessible
private status are unknown with distinct local errors.

## Heartbeat does not refresh capacity

The separate heartbeat observation binds provider, observer, subject kind/reference,
observation/receipt/expiry, and expected interval. Subject kinds are control endpoint,
capability worker pool and execution. Validity is independently capped at 60 seconds.
The interval describes cadence; expiry means unknown liveness.

```text
08:00:00  queue measured: 7; expires 08:00:15
08:00:10  endpoint heartbeat received
08:00:20  another endpoint heartbeat received
          endpoint liveness observed; queue now unknown
```

A heartbeat cannot refresh queue, offer or progress. The implemented heartbeat
receiver checks scope and freshness without modifying the snapshot cache. Native
periodic publishing, worker probes and missed-beat alerts remain unimplemented.
The Core adapter measures an authorized health request, not native heartbeats.

## Ordering, restart and resync

One cache is pinned to authenticated publisher and provider/capability/version.
Sequence numbers increase within one publisher epoch. Duplicate/older sequences
and regressing observation timestamps cannot overwrite newer data.

A sequence gap or epoch change requires a fresh authorized full snapshot read.
Only the trusted runtime marks that read as `resync`; an incoming payload cannot
authorize it. Do not compare sequences across epochs. Retired epochs cannot replace
the new epoch. The prototype retains up to 128 retired epochs, then requires secure
cache rebind rather than silently forgetting replay history. Subscriptions begin
with a full snapshot. Persist ordering state in a production runtime.

## Polling first; live updates optional

The direct adapter polls existing HTTP `POST /v1/health` with the configured client
timeout and caller credentials. There is no new RPC or public unauthenticated probe
endpoint. Poll only at a provider-authorized frequency with bounded backoff.

Optional notifications request a full refresh. Binding support, subscription scope,
expiry, rate limits, reconnect and resync must be negotiated. SSE, WebSocket, MCP
subscriptions and field deltas are not implemented by this profile prototype.
Near realtime means bounded freshness, not a zero-lag or hard realtime guarantee.

## Compact evidence for the main AI

```text
Provider observations
  → trusted Client / Hub runtime
  → check source, scope, order, freshness and arithmetic in code
  → emit an actionable decision event
  → main AI chooses under human authority
  → provider rechecks atomic admission
```

The receiver returns candidate, unavailable or unknown, plus action and reason.
A candidate still needs permissions, privacy, rights and a job-bound offer.
Queue-only candidates need caller permission to wait and workload-specific ETA;
queue depth alone is not a duration. A heartbeat, quote or search result reserves
no compute and grants no payment authority.

Routine heartbeats stay in code. Notify AI when the chosen provider stops accepting,
an ETA breaks a deadline, review is required, work fails or more spending authority
is required. These events do not authorize automatic extra spending or fresh-key
retries after uncertain admission. Jev and LLM calls are unnecessary for polling.

## Run and verify

```sh
npm ci
npm test
npm run demo:runtime
```

The runnable demo directly polls an authorized FFmpeg provider without Hub, emits
compact decisions, and demonstrates expiry using a simulated receiver clock.
Tests cover queue-only versus full queues, stale/future/hidden/wrong-scope data,
arithmetic, ordering and epoch resync, endpoint versus worker heartbeat, unchanged
stale queues, degraded health, and denied authorization on an actual HTTP probe.

Next gates: native publisher epochs and heartbeats; worker probes; shared resource
pools; measured job-progress timestamps; binding subscriptions; Hub ingestion and
scoped search integration; production clock and restart persistence.
