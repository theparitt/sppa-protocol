# Status, governance and roadmap

**SPPA Core 0.1.1 is a working draft.** The maintainers are developing and testing
an open contract, not asserting approval from a standards body. Feedback from
independent caller/provider implementations is required before a stable release.

## Contribution process

Open a repository issue with the problem, use case, interoperability impact and
proposed rule. For a wire change, include schema updates, positive/negative
examples and tests. Changes must keep prose, schemas, binding, examples and
website consistent. Small readable proposals are preferable to speculative
protocol families. Security-sensitive findings should use a private advisory
where available; public issues must redact secrets and user content.

Release reviews require passing conformance checks, independent implementation
feedback, explicit security/compatibility review and a tagged immutable snapshot.
Until then, pin by commit. There is no certification program or trademark-based
compliance promise. The initial repository uses Apache-2.0 for code and authored
specification; embedded third-party software remains under its own licenses.

## Planned stages

| Stage | Scope |
| --- | --- |
| Core 0.1 | Discover, understand, filter, transfer, invoke, monitor and verify |
| 0.2 | Sessions/revisions/review, validation/evaluation, verified feedback and machine reputation |
| 0.3 | Streaming/events, composition/pipeline search, negotiation/payment and advanced transfer profiles |

FFmpeg proves traditional computation and artifacts first. Blender will exercise
long-running preview/revision workflows. AI/Hunyuan3D can exercise GPU workloads.
A provider's internal implementation is private; no app count is a release goal.

The open specification and hosted Hub remain separate. Companies can use private
registries. Future commercial services must not make public Hub a prerequisite
for protocol compliance. Payment is abstract and deferred; Jev is an optional
judge implementation, never a required response mode.

## Resolved draft weaknesses

This version chooses one envelope and manifest version field, full semantic
versions, UTC timestamp rules, typed schemas, exact hard-constraint admission,
opaque artifact ownership, explicit job transitions, caller-scoped idempotency,
atomic transfer/cancel handling, domain-separated Ed25519/JCS signatures and
honest freshness/evidence rules. It separates logical expiry from physical purge
and schema validation from full operational conformance.

Remaining production and future-family work is explicitly recorded rather than
represented as implemented. The original source conversation informs design;
curated specification text is the public implementation contract.

## 0.1.1 admission update

This draft adds provider-owned Capacity/Admission contracts, capability runtime
observations and structured backpressure. It fixes the initial reference's busy
health check, which prevented its queue from accepting work. It also specifies
rolling caller admission rates and a shared root retry budget. Because required
fields and error codes changed, 0.1.1 is an exact new wire version; 0.1.0 schemas,
chapters and API binding remain available as an archived draft.
