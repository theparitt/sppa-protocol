# Private development and launch plan

**Owner direction recorded 2026-10-04. Private development until an explicit release decision.**

## Current decision

Keep detailed specifications, offers, security, reputation, reuse and composition
work in the private repository. Continue local implementation and private CI.
Do not publish the website, change repository visibility, announce the project,
send partner messages or release artifacts without a later owner instruction.
Completing a milestone does not itself authorize a public release.

The near-term target is a convincing M2 proof of the decision standard, not every
feature in the catalog. Demonstrate that the main AI selects between providers
under a human's rules and obtains a usable, verified result.

## Historical disclosure and development record

The repository and GitHub Pages site were public before the owner requested private
visibility on 2026-10-04. Six-layer specification commit
`134379336cc59978905a2c7f6c46d783638ea4e4` was publicly deployed before that change.
Earlier concepts, runtime profiles and reference code were also published.
GitHub subsequently reported the repository private; anonymous checks of both the
repository and Pages site returned 404.

Private visibility does not remove the earlier publication from this record.
Preserve commits, dated decisions, authored designs and test evidence. Do not rewrite
history to imply that all development remained undisclosed. Any IP review must be
given the actual disclosure chronology; this plan makes no legal determination.
Keep existing license notices. No retroactive license change, trademark registration,
patent filing or certification claim is authorized by this plan.

## Existing evidence and gaps

| Component | Current evidence | Gap to the target |
| --- | --- | --- |
| Protocol | Core 0.1.1, typed contracts, FFmpeg HTTP flow, receipts, capacity, eight-group model (six-layer history retained) | Full semantic decision and job-bound offer contracts are not implemented |
| Runtime | Experimental snapshot/heartbeat receiver checks and authorized HTTP probe | Native heartbeat publishing, subscriptions and Hub ingestion remain future work |
| Hub | Local Rust/SQLite MVP, agent credentials, structured search, jobs, artifacts and receipt verification | One provider; no complete cross-provider offer comparison or formal reputation |
| Execution binding | Actual HTTP execution and caller without FFmpeg lookup | MCP binding and its end-to-end proof remain to be built |
| Website | Authored documentation and local build | Public hosting is paused, not a release-ready service |

Protocol source stays in `sppa-protocol`; Hub application code stays in sibling
`sppahub`. API 7770, web 7772; reserve 7771 for the unimplemented admin service.
MCP is an execution binding, not a required dependency of the SPPA standard.

## M0: make decision terms executable

Publish versioned draft contracts privately for semantic capability, provider
configuration, job-bound offers and caller decision records. Pin exact shared
contracts in Hub rather than duplicating types. Retain Core snapshots unchanged.

Acceptance requires code to distinguish pass/fail/unknown for hard rules and to
preserve source, scope, observation time and expiry. Typed prices must normalize
to total job charges and an enforceable ceiling; estimates alone cannot satisfy
a binding budget. Timing separates wait, execution and setup/transfer, with explicit
unknowns. A quote reserves no compute and grants no payment authority.

Test stale offers, changed inputs/configuration, unknown rights, privacy failure,
wrong scope, unbounded charges, incompatible units, non-comparable quality, and
healthy-but-saturated queueing. Define the intended evidence for each of the eight
groups; do not require an entire reputation service for this milestone.

## M1: return a real decision surface from Hub

Register two separate providers for the same versioned `video.transcode` contract.
Return scoped candidates, raw offers, runtime freshness, evidence, exclusions and
unknowns. The main AI chooses; Hub does not silently choose a winner.

Demonstrate policy filtering before preference ordering, scoped discovery, denied
cross-agent access and stale runtime refresh. Keep distinct provider declarations,
observer measurements, run evidence and AI judgments. Private browsing must not
disclose another principal's job or artifact existence.

## M2: select, execute and obtain a usable result

Build the MCP binding using its own negotiated capabilities and authorization;
retain a direct HTTP path to prove transport independence. Use two separately
running provider endpoints, not two labels on the same queued job. If both use
FFmpeg, disclose that shared implementation; do not claim independently authored
implementations or multiple organizations.

Run two reproducible selection cases:

| Case | Fixture terms and observed load | Expected behavior |
| --- | --- | --- |
| Speed preferred, authorized ceiling USD 0.10 | A: USD 0.03 ceiling with longer measured queue; B: USD 0.09 ceiling with shorter observed wait | Main AI selects B when both meet the hard rules and timing evidence supports it |
| Hard ceiling USD 0.05, queueing allowed | Same offers; B exceeds the ceiling | Exclude B before ranking; main AI may select A if all other hard rules pass |

Prices are controlled demo terms until billing is implemented. Queue load must be
created and observed, not fabricated. Disclose prediction methodology and compare
ETA with measured timing. Do not advertise real market prices, charge money or
invent quality scores. If quality evidence is absent, keep it unknown; reputation
is not required for these two cases. A reusable-result candidate is deferred until
authorized reuse and fingerprint contracts actually work.

For each case, record authorized candidate evidence and the main AI's decision,
perform the chosen call through MCP, and obtain an actual H.264 output. Validate
the expected output properties, size/hash and execution receipt. Capture inputs,
parameters, configuration revisions and observed times. Verify that the caller
does not invoke FFmpeg itself. Local multi-process execution is not a two-machine
proof and must be labeled accordingly.

Exercise stale data, busy admission, denied privacy/rights, uncertain invocation
and idempotent retry. Recheck policy/terms/capacity atomically at the provider.
Define a clean, repeatable command and preserve test reports as development evidence.

## Release decisions after M2

Owner review is still required before publication. Review the actual disclosure
history and desired IP/brand approach with the appropriate adviser if the owner
chooses that route. Record the decision rather than treating a private commit or
this plan as legal protection.

The intended eventual open set is specification, schemas, conformance tests,
execution bindings, reference SDK and reference providers. Hosted operations,
private operational data, anti-abuse internals and commercial infrastructure can
remain separate. This is a proposed release boundary, not a new license agreement.

Brand and conformance terminology need an owner-approved policy and demonstrable
tests before any official verification mark is used. No registered rights or
certification program are claimed here.

Launch material should lead with the problem and working result, then explain the
protocol. Describe the two providers, policy change, AI decision and actual output.
Do not claim a live public network, measured savings, reputation history or reuse
that has not been demonstrated. Proposed domains are not purchased or deployed.

## Publication control

The workflow validates private changes but configures/uploads/deploys Pages only
when the repository is public **and** `SPPA_PUBLIC_RELEASE_ENABLED` is explicitly
`true`. Keep that switch unset during this stage. A manual validation run alone
does not publish. Do not enable it merely because M2 passes.
