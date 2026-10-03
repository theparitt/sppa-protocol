# SPPA Protocol Suite

Software capabilities for AI.

**SPPA is a machine-first semantic capability and decision standard that gives
AI agents normalized information to discover, compare, select, and compose
software capabilities across providers.** This is the proposed standard's
definition; SPPA remains a working draft.

**Semantic Capability + AI Decision Contract** are the core pair. SPPA supplies
decision data independently of transport. Execution can use MCP, HTTP, or another
declared binding. Main AI makes the final provider choice. Start with the
[SPPA Concept](design/concept.md), then
[Architecture & execution bindings](design/architecture.md) and the
[AI Decision Contract](design/decision-contract.md). These are design proposals,
not a deployed MCP binding. The existing Core 0.1.1 HTTP reference below remains
reproducible; it does not yet implement the full decision standard.

**Built for AI, end to end:** Discover → Select → Run → Monitor → Evaluate → Rate → Compose.
AI agents operate the capabilities; humans supply intent and authority.

**SPPA = Specific Purpose Platform/App.** A provider exposes high-level
capabilities such as `video.transcode`; the caller discovers its contract,
checks hard constraints and policy, transfers artifacts, invokes work and
verifies execution evidence. A provider does not need to contain AI.

**SPPA Core 0.1.1 is a working draft**, not a ratified standard or production
certification. Direct providers and private registries work without public Hub.
SPPA Hub is a separate reference service in the sibling `sppahub` repository.

- [Public introduction](https://theparitt.github.io/sppa-protocol/)
- [Published document index](https://theparitt.github.io/sppa-protocol/documents/)
- [Specification source](spec/0.1.1/overview.md)
- [Schemas](schemas/0.1.1/) and [OpenAPI binding](openapi/0.1.1.json)
- [Weakness review and design decisions](docs/open-decisions.md)
- [Conformance and implementation limits](spec/0.1.1/conformance.md)

## What is implemented

Core covers discovery, capabilities, constraints, jobs, artifacts, transfer,
policy, security, monitoring, errors, receipts, versioning and Capacity/Admission. This repository
contains 18 JSON Schema 2020-12 contracts, typed examples, JavaScript validators
and HTTP client, a loopback FFmpeg provider, behavioral tests and a public static
documentation site with search and an offline schema bundle.

Jobs have explicit terminal states, caller-scoped idempotency and retry lineage.
Artifacts have opaque ownership-bound identities and verified sizes/hashes.
Policy is enforced before execution. Receipts use Ed25519 and RFC 8785
canonicalization, with pinned keys and expected execution context.

## Capacity and admission update

Each capability declares its own concurrency, FIFO queue, rolling caller rate,
timeout and retry budget. Health exposes fresh capability load independently of
operational status. Busy providers can queue work; queue/rate errors carry typed
backpressure and optional millisecond retry hints. Root lineage budgets prevent
branching retries from resetting attempt limits.

[Capacity and Admission](spec/0.1.1/admission.md) is part of the new exact 0.1.1
wire version. Original [0.1.0 resources](https://theparitt.github.io/sppa-protocol/spec/0.1.0/overview/) remain archived.

## Run in WSL

Requires Node.js 22+ and FFmpeg with the `libx264` encoder on the provider machine.

```bash
cd /home/theparitt/work/sppa-protocol
npm ci
npm run check
npm run demo
npx playwright install chromium
npm run test:site
npm run preview
```

Preview: <http://127.0.0.1:8247/sppa-protocol/>. The demo forks a separate
provider process and disables software lookup in the caller. It runs a real
transcode, checks downloaded bytes and verifies the signed receipt. This is a
loopback interoperability demonstration, not a two-machine deployment.

To run the development provider yourself:

```bash
SPPA_TOKEN="$(openssl rand -hex 32)" npm run provider
```

The provider binds only to loopback and prints its endpoint/public key. Production
requires durable storage/idempotency, key lifecycle management, quotas and an OS
sandbox. Those are explicitly outside this development harness's guarantees.
It does not advertise the optional signed-request profile; the reusable signing
and replay helpers have unit coverage.

## Repository and publication

`spec/` is the authored draft; `schemas/`, `openapi/` and `examples/` describe the
wire contract. `src/` and `reference/` demonstrate implementations. `site/` and
`scripts/build-site.mjs` generate `dist/`. GitHub Actions validates protocol and
website behavior before deploying `main` to GitHub Pages. Source conversations,
credentials, dependencies and generated browser artifacts are excluded from Git.

Sessions/revisions, evaluation, feedback and reputation are planned for 0.2;
streaming, composition, payment and advanced transfers for 0.3. They are not
advertised as implemented Core capabilities. See [governance](spec/0.1.1/governance.md).

Code and authored specification are licensed under [Apache-2.0](LICENSE).
Read [CONTRIBUTING.md](CONTRIBUTING.md) for proposals and [SECURITY.md](SECURITY.md)
for responsible reporting. Until a reviewed release is tagged, pin a commit.
