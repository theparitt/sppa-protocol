# SPPA protocol working rules

Read README.md and docs/understanding.md before changes. Source history, when
available locally, lives in ignored docs/reference. Public contract decisions
are in docs/open-decisions.md and spec/0.1.0, with discussion context in
docs/discussion-decisions.md. Do not publish raw conversation exports.
Implement Core v0.1 first, with remote FFmpeg proof. Keep Hub application code
in the sibling repository. Direct/private protocol use must work without Hub.
Hard constraints/policy are eligibility rules; fuzzy scores cannot override them.
Use immutable artifacts and typed requests; bulk bytes do not belong in JSON.
Jev, Bleepwave, RabbitMQ and vendor/runtime choices are optional implementations.
Resolve ambiguities from docs/open-decisions.md explicitly and update documents.
Cryptographic execution receipts are distinct from output-quality validation.
