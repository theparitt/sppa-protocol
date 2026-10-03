# SPPA protocol working rules

Latest user-approved direction is in design/architecture.md and
design/decision-contract.md. SPPA owns semantic capabilities, provider offers,
hard eligibility and decision evidence. Semantic Capability + AI Decision
Contract are the core pair, independent of transport. Execution may use MCP,
HTTP or another declared binding; MCP is not a required dependency or the
definition of SPPA. Reuse existing execution plumbing in each binding.
Preserve its existing exact snapshots and runnable proof. Main AI selects;
Hub returns candidates. Human-facing landing explains purpose before specs.
Distinguish proposed lifecycle/contracts from implemented reference behavior.

Read README.md and docs/understanding.md before changes. Source history, when
available locally, lives in ignored docs/reference. Public contract decisions
are in docs/open-decisions.md and spec/0.1.1, with discussion context in
docs/discussion-decisions.md. Do not publish raw conversation exports.
Implement Core v0.1 first, with remote FFmpeg proof. Keep Hub application code
in the sibling repository. Direct/private protocol use must work without Hub.
Hard constraints/policy are eligibility rules; fuzzy scores cannot override them.
Use immutable artifacts and typed requests; bulk bytes do not belong in JSON.
Jev, Bleepwave, RabbitMQ and vendor/runtime choices are optional implementations.
Resolve ambiguities from docs/open-decisions.md explicitly and update documents.
Cryptographic execution receipts are distinct from output-quality validation.

Preserve archived versioned schemas/spec/API. Required wire changes use a new
exact draft version. Keep operational health separate from saturation; provider
atomic admission owns queue/rate/retry budgets. Idempotency replay precedes
capacity rejection; fresh retries never reset the root lineage budget.
