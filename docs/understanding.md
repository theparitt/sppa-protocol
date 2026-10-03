# Reconciled SPPA understanding

Prepared 2026-10-03 from the full shared discussion, final
Technical Master Plan, and
Protocol Suite.
Latest plan/suite and explicit user corrections guide this preparation;
earlier suggestions remain source history.

## Four distinct concepts

| Concept | Meaning |
| --- | --- |
| SPPA | Specific Purpose Platform/App: the specialized app/service |
| Capability | A high-level job offered by an SPPA, e.g. `video.transcode` |
| SPPA Protocol | Shared caller/Hub/provider contracts |
| SPPA Hub | Reference network for discovery, search, comparison, monitoring, trust and composition |

SPPA need not contain AI. Traditional software and GPU/AI services are both
first-class providers. Capabilities declare features, parameters, input/output
schemas, constraints and interaction modes. Main AI need not install the
underlying software locally or construct its command-line syntax.

Human supplies intent and receives outcomes. Main AI plans, searches, chooses,
invokes, reviews and continues the workflow. Hub returns candidates/evidence.
Provider executes through its own runtime; the protocol defines what is
communicated, while the provider chooses how and where work runs.

## Open protocol and machine-first Hub

The protocol must work with direct providers and private registries, without
public Hub. Hub is a reference service, not the definition of SPPA itself.
The conversation proposes separate `.org` specification/reference and `.com`
hosted-service roles. No domain has been purchased or deployed here.

Machine APIs are primary; human pages are secondary views for inspection,
publication and docs. Discovery centers on capabilities and requirements,
rather than app names. Keep the human view simple and restrained.

## Eligibility and selection

Combine semantic retrieval with structured matching. Hard constraints, policy,
permissions and current health determine eligibility before ranking. A privacy,
location, format or size mismatch cannot be rescued by a higher fuzzy score.
Eligible candidates expose separate dimensions, confidence and evidence.
Rules verify deterministic facts; optional judges evaluate fuzzy fit/quality.
Main AI chooses a provider according to the user's priorities.

## Artifacts, jobs and storage

Large inputs/outputs use opaque artifact references, not filesystem paths or
bulk bytes in ordinary JSON. Artifacts are immutable; metadata includes hashes,
ownership/permissions, retention and provenance. Temporary transfer endpoints
move bytes. Storage can belong to Hub, provider, user, local/private systems
or object storage.

Hub's Artifact Broker resolves location and authorized access. It does not
require all files to be stored centrally. Hub tracks jobs/receipts; capability
execution remains provider-owned. Lifecycle diagrams show Main AI invoking the
chosen provider. Exact optional gateway/proxy/delegation semantics remain open.

Later sessions preserve base/working/accepted pointers, history, optimistic
concurrency and idempotency over immutable artifacts. Provider cache/session
state is not the portable source of truth. Later composition should avoid
round-tripping intermediate files through the caller's device.

## Evidence, evaluation and reputation

Execution receipts link caller/provider identity, capability/version, hashes,
timestamps, status and signatures. Verification establishes evidence relative
to trusted signer identity; it does not prove output quality.

Provider code validates facts; caller AI evaluates usefulness; independent Hub
judges evaluate evidence. Jev is an optional adapter behind neutral contracts.
Verified ratings/feedback require verified execution receipts. Reputation is
multidimensional: reliability, validation, retries, latency, quality, confidence
and downstream composition success, rather than just stars.

## Rollout

| Release | Protocol families |
| --- | --- |
| Core v0.1 | Discovery; Capability; Constraints; Invocation/Job; Artifact; Transfer; Policy; Security; Monitoring; Error; Execution Receipt; Versioning; Capacity/Admission |
| v0.2 | Session/Revision; Review; Validation; Evaluation; Feedback; Machine Reputation |
| v0.3 | Streaming; Event/Subscription; Composition; Negotiation; Payment |

The original suite has 23 families plus the envelope. The subsequent Capacity/Admission addition brings the roadmap to 24 families, with 13 in Core. Master-plan interaction
modes are request/response, async job, iterative session, streaming, subscription
and interactive control. All are not mandatory Core modes; interactive control
still lacks a detailed suite definition.

Core proof: AI on a machine without FFmpeg -> Hub discovery -> eligibility/auth/
health checks -> transfer/reference video -> invoke remote FFmpeg -> monitor ->
retrieve output artifact -> verify receipt. FFmpeg is first; Blender and
AI/Hunyuan3D follow for iterative and GPU workloads after relevant contracts.

## Repository ownership and proposed stack

`sppa-protocol` owns contracts, schemas, fixtures, compatibility, conformance,
SDKs and reference provider work. `sppahub` owns the application/database,
search, monitoring, brokers, tracking and human view. Hub consumes an explicit
protocol version rather than forking shared types.

The master plan suggests Rust, Actix Web, PostgreSQL, serde, JSON Schema,
OpenAPI and abstract storage with local/S3-compatible/R2 adapters. This is the
Hub preparation baseline, not a protocol-wide language/vendor requirement.
Hybrid edge/static/storage hosting with a portable core backend is a discussed
option for the future Hub; the protocol documentation uses GitHub Pages.

Bleepwave may be an SPPA offering dispatch/routing/monitoring. RabbitMQ may
implement that provider internally. Neither is a Hub core requirement.

## Capacity and final admission

The latest shared follow-up adds capacity to each capability contract. Providers
own concurrency, queue, authenticated caller rate, end-to-end timeout and retry
budgets; a Hub indexes declarations and fresh capability load. Caller AI can
choose using available slots, queue depth and evidence-based wait estimates.
The provider performs final atomic admission; a search result reserves no slot.
Operational health and saturation are separate. Queueing can be available while
all execution slots are occupied. Core 0.1.1 makes these semantics explicit.
