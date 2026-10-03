# Draft weakness review and decisions

The shared discussions established the architecture, but their sample wire
formats were inconsistent. The authored Core 0.1.0 draft makes the following
explicit decisions. Historical examples are not normative contracts.

| Weakness | Implemented resolution | Evidence |
| --- | --- | --- |
| Conflicting manifest/envelope fields | `sppa: "0.1.0"`, provider/specification kinds, typed payloads, strict extension rules | Shape/operation/version tests |
| Unspecified units and identifiers | Full versions, UTC timestamps, byte sizes, reverse-DNS providers, opaque scoped artifact IDs | Malformed timestamp/identity tests |
| Hard constraints mixed with ranking | Eligibility gates first; no privacy downgrade, supported privacy, location/region, training/logging/retention, permission/approval checks | Hard rejection tests |
| LOCAL_ONLY could mean LAN | Same caller device; private network is separate | Remote LOCAL_ONLY rejection |
| Untrusted URLs/schema refs | No Core caller URL fetching; external schema refs rejected, HTTPS except explicit loopback, same-origin bearer delegation | Endpoint/schema tests |
| Caller strings treated as authority | Auth-derived identity, owner checks, grants bounded by authenticated rights, provider-bound responses | Authentication/ownership/permission tests |
| Mutable or incomplete uploads | Size/SHA-256 verified before atomic commit, immutable bytes, completion lock and abort/expiry rechecks | Integrity/immutability/abort tests |
| Aborted download endpoint survived | Abort revokes temporary byte access; a fresh authorized transfer can be prepared | Download abort regression |
| Job retry and cancellation races | Terminal immutability, explicit retry lineage, scoped idempotency conflicts, deadlines and final state recheck | Job/cancel/retry/idempotency tests |
| Signature without canonical context | Domain-separated Ed25519/JCS; pinned key and caller/provider/job/capability/version/parameter/input/output binding | Receipt tamper/key/context tests |
| Undefined signed-request replay | Optional profile specifies nonce/expiry/provider binding; replay helpers tested, reference does not advertise profile | Replay tests |
| Ambiguous JSON and unsafe values | Duplicate member rejection, safe integers, Unicode checks, depth limit, bounded bodies | Parsing negative tests |
| Monitoring and quality claims | Fresh provider-bound observations, no invented benchmarks; receipts prove assertions, not quality | Health tests; security/monitoring chapters |
| Transfer rollout contradiction | Direct checksum transfer mandatory in Core; multipart/resume/server-to-server reserved for future profiles | Artifact chapter/profile restrictions |
| Demo mistaken for production | Loopback-only reference, separate processes, explicit in-memory/key/sandbox limits | Real FFmpeg demo/conformance limits |
| Website mistaken for provider | Static catalog with `kind: specification`, no invocation endpoint | Catalog schema/site checks |

## Remaining before stable or production claims

- Independent caller/provider interoperability and security review.
- Restart-durable provider idempotency/transactions, encrypted storage and verified
  physical purge, trusted key rotation/revocation and OS isolation. The reference
  is ephemeral; passing its tests does not satisfy these production requirements.
- Hub registry ownership/delegation and broker integration in `sppahub`.
- Versioned sessions, evaluator evidence/reputation scales, streaming/composition,
  negotiated payment and advanced transfer profiles in their planned stages.

Source conversations are retained locally, excluded from public Git. Public
contracts are the curated specification, schemas, API binding and examples.
