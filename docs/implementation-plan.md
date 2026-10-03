# Core implementation status and next work

Core 0.1.0 now has an authored specification, schemas, validators, a client,
FFmpeg reference provider, executable tests and a standards website.
See [README](../README.md) for commands and [review decisions](open-decisions.md)
for corrected weaknesses.

## Acceptance evidence

Tests cover schemas/parsing, hard policy rejection, auth-derived identity,
cross-owner access, idempotency conflict, immutable checksummed uploads,
transfer abort, terminal cancellation/retry and signed receipt tampering/context.
The separate-process demo completes a real FFmpeg transcode with caller software
lookup disabled and verifies output integrity and receipt signature. The site
has link/schema-bundle checks and desktop/mobile browser tests.

The harness is loopback and ephemeral. Restart durability, independent
implementations and production security/storage review remain open; see
[conformance limits](../spec/0.1.0/conformance.md).

## Next: integrate Hub separately

Pin the protocol commit in `../sppahub`. Build registry ownership/indexing,
capability search, deterministic policy gates, health refresh, authorized
artifact resolution and job/receipt tracking. Caller AI chooses the provider;
providers own execution. Hub must not become mandatory for direct use.
Provider internal queues such as RabbitMQ are not Hub core requirements.

## Later families

0.2: sessions/revisions/review, validation/evaluation, verified feedback and
machine reputation. Blender can exercise preview/revision workflows.
0.3: streaming/events/composition, negotiation/payment and advanced transfers.
AI/GPU references follow when their required contracts are defined.
