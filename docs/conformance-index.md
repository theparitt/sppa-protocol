# Conformance and tests

**Working reference coverage; no certification claim.**

## Shape checks

Core 0.1.1 includes versioned JSON Schema contracts and an HTTP binding. The validator checks typed envelopes, operation payloads, parameters, capability declarations and artifacts without fetching remote schemas.

## Behavioral checks

The protocol suite checks atomic capacity/admission, queue/rate/retry limits, scoped idempotency, ownership, transfer integrity, cancellation/deadline behavior and receipt context.

The reusable runtime hook has a PNG capability regression that checks distinct provider identity, artifacts and receipts. Failed backend probes exclude new admission while existing idempotent replay remains available.

The separate Hub suite checks agent scopes, hard policy gates, unknown commercial/price terms, per-agent resources, tracking and restart behavior. Browser checks cover small screens, navigation and agent prompt copying.

## Run the checks

```sh
cd sppa-protocol
npm run check
npm run test:site

cd ../sppahub
npm test
cargo fmt --check
cargo clippy --locked --all-targets -- -D warnings
npm run test:site
```

See [Core conformance requirements](../spec/0.1.1/conformance.md) and [implementation examples](examples.md).

## Limits

Passing schemas and reference tests does not establish independent interoperability, production isolation, durable provider recovery, offer enforceability, billing correctness or perceptual output quality.

An eventual conformance program needs pinned releases, independent implementations and reproducible negative tests. The [Position Paper](position-paper.md) describes the evaluation agenda.

