# Conformance and implementation status

Conformance is more than a JSON document matching a schema. Test the binding,
semantics, authentication, integrity and lifecycle behavior as well.

## Run locally

```bash
npm ci
npm test
npm run demo
npm run build
node scripts/check-site.mjs
```

`npm run check` combines automated tests with the site build/link checks.
The reference provider tests require FFmpeg. The website is static and never
accepts uploaded user files or executes compute jobs.

## Core requirements matrix

| Family | Required check |
| --- | --- |
| Discovery | Manifest/profile/version shape; unique capability contracts; trusted endpoints |
| Capability | Typed parameters/results; no arbitrary external schema loading |
| Constraints | Hard rejection before subjective ranking or execution |
| Capacity/Admission | Declared per-capability limits; fresh load; queue/rate/retry enforcement; scoped idempotency before capacity checks |
| Jobs | Exact transitions; terminal immutability; deadlines; cancel race; retry lineage |
| Artifact | Opaque provider-scoped identity, ownership, immutability and expiry |
| Transfer | Size/hash verification, temporary authorization, atomic commit/abort |
| Policy | No privacy downgrade; location/region/data-use/permission/approval enforcement |
| Security | Auth-derived caller identity, isolated access, trusted keys and replay rules |
| Monitoring | Provider binding, fresh timestamp windows, actual observations |
| Error | Stable codes, HTTP mapping, retry guidance, no private internals |
| Receipt | Canonical signed evidence, context and expected execution/hash binding |
| Version | Exact versions; explicit unsupported behavior and extensions |

The automated tests cover valid/invalid shapes, duplicate JSON names, unsafe
numbers, hard constraints, stale health, identity spoofing, byte integrity,
job cancellation/retry/failure, idempotency conflict and signed-evidence tampering.
The reference demo checks a real transcode, output integrity and receipt signature.

## Limits of the current harness

This first implementation demonstrates intra-process idempotency and loopback
provider/caller interoperability. It does not prove restart durability,
multi-replica transactions, production storage encryption/physical deletion,
revocation infrastructure, OS sandbox security or independent provider honesty.
The HTTP provider does not advertise the signed-request profile; its replay
semantics are tested through reusable helpers. No production-certified label
or third-party standards approval is implied by passing this repository's tests.

## Reporting interoperability defects

Include the pinned protocol commit, provider/capability versions, operation,
redacted request/response, expected normative rule and smallest reproduction.
Do not attach bearer tokens, signed URLs or private artifact content.
Use the repository issues for specification/conformance defects. See Governance
for proposal and release policy.
