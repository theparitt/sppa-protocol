# AI Decision Contract

**Design proposal · 2026-10-03 · Not a Core 0.1.1 schema or deployed Hub API**

The contract starts with the caller's decision: **which provider can satisfy
this goal under these hard requirements, and how do the eligible offers
compare?** Together with **Semantic Capability**, it forms the center of SPPA.
It defines meaning and decision evidence independently of transport. Execution
may use MCP, HTTP, or another declared binding; MCP is not required.

## Decision data in seven groups

The proposed [Decision Information Layers specification](/sppa-protocol/spec/decision-layers/0.1.0-draft.1/)
separates declared capability/configuration, runtime, job-specific offer,
execution/validation evidence, evaluation/feedback and aggregated reputation.
Policy and authority apply across all six. Layers classify the kind of assertion;
the seven groups below classify its subject. An operational value can be a declared
limit, a fresh queue measurement, an ETA or a historical timing statistic.

| Group | Information the agent uses |
| --- | --- |
| Technical | Semantic capability/version, supported features, input/output meaning and limitations |
| Operational | Online/offline status, queue, estimated wait/runtime/completion, capacity and freshness |
| Quality | Scoped quality measurements, reliability, validation success and composition success |
| Economic | Pricing unit/rate, estimated total cost, currency and enforceable spending limits |
| Policy | Privacy, confidentiality, region, data residency, licensing and commercial-use rights |
| Trust | Verified executions, evidence source, reputation, sample size and confidence |
| Reuse | Whether an authorized compatible artifact exists, its freshness and reuse terms |

These groups form the caller's **decision surface**. They describe the proposed
contract, not metrics already collected by the reference provider. Required
privacy and rights are hard gates; speed, cost, and quality are preferences only
after the gates pass. The main AI makes the final choice.

## Four distinct objects

| Object | Scope | Required meaning |
| --- | --- | --- |
| Capability contract | Relatively static | Semantic ID and version, features, input/output semantics, parameters, guarantees, constraints |
| Provider offer | Dynamic, job-specific | Provider identity, capability revision, bound inputs/parameters, price, timing, capacity, policy and rights, expiry |
| Machine reputation | Measured historical evidence | Capability and configuration scope, evaluator, benchmark, observation window, sample counts, confidence and verification |
| Caller decision policy | Current goal | Hard requirements, authority, acceptable evidence, and soft priorities |

An offer is neither a capability contract nor reputation. An execution receipt
proves a signed assertion about an execution, not that the result meets a
quality benchmark. Provider-claimed quality must not masquerade as measured
reputation.

## Caller requirements first

The following is a conceptual example, not an accepted runtime request:

```yaml
capability:
  id: video.transcode
  version: 1.0.0
  features: [h264, audio_copy]
requirements:
  privacy: confidential
  commercial_use: true
  execution_regions: [TH]
  max_total_cost:
    amount: "0.20"
    currency: USD
  allow_external_side_effects: false
  allow_reuse: true
priorities:
  quality: 1.0
  reliability: 0.9
  cost: 0.7
  completion_time: 0.5
```

Only supplied requirements are constraints. Missing requirements are not consent
to side effects, disclosure, or spending. The caller's authorization and grants
remain independently enforced. Weights express preferences among eligible
offers; they cannot override hard requirements.

## Eligibility has three outcomes

Return **eligible**, **ineligible**, or **unknown**, with per-requirement reasons
and supporting evidence. Only eligible candidates enter the selectable set.
Unknown information needed for a hard requirement must fail closed until resolved.
Do not convert absent observations into zero cost, zero wait, or perfect quality.

Check capability/version and feature fit, input limits and semantic compatibility,
permissions, side effects, confidentiality, training/logging/retention, execution
and storage regions, license/use rights, quote limits, freshness, and availability.

Commercial use is checked separately for implementation, underlying components,
input, output, and service-hosting rights where applicable. Provider assertions
carry their source; trusted verification is bound to exact terms and a scope.
Caller input-rights declarations are attestations, not independently proven facts.
Inherited output restrictions and attribution obligations travel with the result.

Private offers and reuse candidates must be access-filtered before search or
comparison. Unauthorized callers must not learn that a confidential input or
matching result exists through an artifact hash lookup.

## Bind the offer to the work

Each proposed offer needs an immutable ID/revision, issuer and authenticated
provider identity, capability/version, input content and parameter digests,
execution configuration, terms revision, observed time, expiry, and evidence
references. Estimates must declare their units, method, confidence, and source.

A changed input, parameter, terms revision, or execution configuration requires
re-evaluation. Selection reserves no capacity. The provider rechecks authority,
terms, and atomic admission at execution time. The binding should carry an offer
reference through the chosen binding's arguments/results and evidence. MCP
bindings use MCP authentication and messages; HTTP or other bindings declare
their corresponding identity and correlation mechanisms. Offer semantics stay
the same across bindings.

## Money is more than a rate

Use an ISO currency code and exact decimal-string amounts, with a named pricing
unit: per job, second, minute, CPU/GPU second, token, frame, megapixel, GB, or
artifact. Specify the quantity definition, billing increment, minimum charge,
taxes/fees, transfer/storage charges, cancellation/retry charges, and total.
Missing quantities are unknown, not free.

Distinguish an estimate from a binding maximum quote. An estimate below a caller's
hard spending limit is not enough: require a valid bound quote or provider-enforced
spending cap covering all charges. The landing-page prices are illustrative totals,
not a billing implementation.

Do not compare different currencies without a caller-accepted exchange source,
rate timestamp, and conversion uncertainty. Cost normalization must retain the
original amount and currency; a score does not authorize payment.

## Capacity, queue and completion time

Return observation/expiry times, operational health, running jobs, available
slots, queue depth, estimated wait, estimated runtime, and estimated completion.
Queue depth alone does not estimate delay. For a single execution, completion
duration equals wait plus runtime plus separately disclosed transfer/setup time;
unknown components make a total unknown. Specify whether timestamps or durations
are used, and use one declared unit.

Estimates need a workload class, prediction source/method, and confidence or
uncertainty bounds. Capacity arithmetic must match declared concurrency and
queue limits. Offers expire; a healthy busy provider can remain eligible for
queueing if the caller permits it. Admission remains atomic at the provider.

## Quality and reliability must be comparable

Each metric needs a definition, benchmark/evaluator version, task domain,
capability/configuration scope, observation window, numerator/denominator or
sample count, uncertainty method, and issuer. Compare quality only within a
shared benchmark scope. If scopes differ, return **not comparable** rather than
inventing a common score.

Separate success rate, validation pass rate, composition success, latency
prediction accuracy, and cost prediction accuracy. Define what counts as failure,
whether canceled jobs are excluded, and how outcomes are verified. Small samples
and selection bias must remain visible. A provider's expected quality and an
independent measurement are different dimensions.

Structured feedback should bind an authenticated caller, authorized execution,
receipt, evaluator, and result. A Hub should deduplicate feedback and mitigate
replay, collusion, and fabricated run counts before publishing reputation.
Provider signatures alone do not make feedback independent or truthful.

## Reuse is an authorized candidate

Exact reuse needs input digests, canonical parameter digest, capability revision,
execution/model configuration, relevant policy, output integrity, provenance,
rights, retention, and a freshness bound. Nondeterministic or external-state
work needs an explicit reuse policy. Idempotent request replay is different from
cross-job cached-result reuse.

Matching hashes do not grant access. Check ownership/tenant scope, privacy,
consent, output-use rights, and caller authorization before revealing a match or
returning an artifact. A reused result may carry transfer and licensing costs;
do not presume cost zero. Changed rights or expired retention invalidate reuse.

## Return a decision surface, not a hidden winner

Return eligible candidates, exclusions and unknowns, raw observations with units
and provenance, comparable dimensions, and optional caller-requested ordering.
Preserve the original values alongside normalized scores. Disclose normalization
method, direction, missing-data treatment, and weighting. A candidate-set-relative
score changes when candidates change; stable tie-breaking must be explicit.

The main AI chooses and records its rationale against the human's goal and
authority. A Hub must not silently substitute sponsored ranking or its own
weights for caller priorities. No universal "best provider" is defined.

## Artifacts and composition

An artifact includes semantic type, content identity, produced-by capability and
version, input lineage, owner/access scope, retention, and transferable rights.
MIME compatibility alone does not imply semantic compatibility. A character
reference PNG and a depth-map PNG serve different roles.

Composition checks semantic role, required features, schema/version, privacy,
rights and destination authority at every step. Cross-provider use needs an
explicit authorized transfer or access grant. The composition graph records
dependencies and evidence; it does not bypass the chosen execution binding or
provider admission.

## Acceptance gates for implementation

Before implementing Hub selection, publish reviewed versioned schemas and
fixtures covering: stale offers; unknown commercial rights; forbidden residency;
unsupported features; denied external effects; price estimates without spending
caps; mixed currencies; non-comparable quality; low sample confidence; changed
inputs/parameters; unauthorized reuse; expired artifacts; duplicate feedback;
and saturation without health failure.

Then demonstrate two independent providers implementing one semantic contract
and show the decision data surviving both HTTP and an MCP binding. Changing
priority should reorder eligible offers without admitting
an excluded candidate. The caller must make the final choice and the provider
must recheck admission. This proposal does not claim those gates have passed.
