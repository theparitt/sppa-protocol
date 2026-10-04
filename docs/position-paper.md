# SPPA: Semantic Capabilities and Decision Contracts for AI-Operated Software

*Why AI needs more than tool connectivity to choose software autonomously.*

**SPPA Position Paper · Version 0.1-draft.1 · 5 October 2026**

**Status:** design proposal with a working private reference. This paper is not a ratified standard, production certification or evidence of a live public network.

## Abstract

An AI agent may know how to invoke several tools yet lack comparable information about which tool should perform a particular job. The decision depends on the requested result, supported features, authority, privacy, cost, current load, timing and evidence about previous outcomes. Those dimensions change independently and may come from different sources.

SPPA proposes a machine-first semantic capability and decision standard. Its core pair is **Semantic Capability + AI Decision Contract**: a shared description of the outcome sought, together with scoped information needed to discover, compare, select, use and evaluate software implementations. Main AI makes the selection under the human owner's constraints. Providers execute specialized work through a declared binding such as MCP or HTTP.

The contribution proposed here is normalized decision information across providers, rather than a new general-purpose execution transport. A private reference already demonstrates authenticated search, two FFmpeg deployments, background removal, artifact integrity and signed execution evidence. Job-bound offers, automated billing, an MCP binding, authorized reuse and historical reputation remain unimplemented. The paper specifies the hypothesis, boundaries and experiments needed to assess whether the additional contract improves agent decisions.

## 1. The problem: invocation is only one decision

Consider an agent asked to convert a confidential video for commercial delivery within an authorized budget. It can reach several implementations of `video.transcode`. An executable input schema answers how to call a particular implementation. It may not establish whether that implementation is permitted, presently available, compatible with the output requirement or able to enforce the total spending ceiling.

The agent must answer several questions before executing:

- Does this implementation produce the requested result, including the relevant features and limitations?
- May this input be sent there, and may the output be used for this purpose?
- Is the worker healthy, immediately available, queue-only or currently unknown?
- What terms apply to these exact inputs and parameters?
- Which statements are declarations, measurements, historical summaries or judgments?
- Would an existing authorized result satisfy the same requirement?
- Will this result be usable by the next capability?

Applications can collect that information today. The recurring problem is that each application must interpret provider-specific descriptions, units, policies and evidence. Free-form prose can be useful context, but does not by itself establish a comparable, enforceable job contract.

The proposed benefit of SPPA is less repeated integration and clearer decisions. Whether it reduces time, cost or agent errors is an empirical question; no numerical improvement is claimed in this draft.

## 2. A fair relationship to existing tools

Tool connectivity already contributes semantics. MCP tools, for example, include names, descriptions, input schemas and optional output schemas and annotations. Their descriptions can help a model select a tool. The MCP specification also warns clients about trusting annotations from untrusted servers. See the [MCP Tools specification](https://modelcontextprotocol.io/specification/2025-11-25/server/tools).

SPPA does not claim that MCP is unable to carry decision information, that existing systems lack discovery, or that all tool callers are unaware of policy. Rich application metadata could express many of the proposed fields.

The narrower question is whether providers and callers can agree on **common decision meanings**: a total job ceiling rather than an ambiguous rate; a queue reading with its own expiry; commercial rights with an explicit unknown state; quality measured under a particular rubric; reuse tied to permission and input equivalence.

| Existing approach | Useful starting point | Proposed SPPA contribution |
| --- | --- | --- |
| A local CLI or SDK | Direct control over installed software | Capability discovery when choosing among installations or remote services is useful |
| A tool connection such as MCP | Tool discovery, structured calls and results | Comparable capability and decision records across implementations |
| A provider-specific API | A concrete service and its own operational terms | Normalized meanings for matching and comparing equivalent outcomes |
| An application registry | A place to find implementations | Job-specific eligibility, fresh context and evidence that remain usable outside the registry |

These approaches can coexist. A local tool may be the best option for sensitive inputs or small jobs. Remote discovery and transfer add overhead. SPPA should not force every invocation through a marketplace or remote service.

## 3. Definitions and scope

**SPPA** expands to Specific Purpose Platform/App: specialized software used by an AI agent. The provider itself can be ordinary deterministic software. It does not need an LLM, planning loop or autonomous agent inside it.

A **Semantic Capability** identifies a result-oriented function and its contract. For example, `video.transcode` describes a transformation, whereas `ffmpeg.any_command` exposes an implementation's command language. Feature and parameter constraints still matter: sharing a capability label is not enough to establish substitutability.

An **AI Decision Contract** describes the information, authority and evidence needed to assess an implementation for a particular job. It includes the caller's hard requirements, provider terms, freshness and provenance rules and an auditable decision record.

**Main AI** is the caller that translates human intent into requirements and chooses among eligible options. **SPPA Hub** is a reference discovery and inspection service. **Provider** is the authority that admits and executes work and makes its own bounded claims.

SPPA is transport independent. MCP, HTTP and other bindings may carry calls and results. A public Hub is optional; direct providers and private registries are valid deployments. The semantic contract should survive a change in execution binding.

## 4. A running example

The following values are hypothetical teaching data, not market prices, benchmark results or live offers.

| Candidate | Maximum total charge | Estimated wait | Estimated run | Reuse |
| --- | --- | --- | --- | --- |
| A | USD 0.03 | 80 seconds | 25 seconds | No |
| B | USD 0.08 | 5 seconds | 30 seconds | No |
| C | USD 0.00 under this illustrative agreement | 0 seconds | 0.2-second retrieval estimate | Candidate cached output |

**How should an AI decide which one to use?**

With an enforceable USD 0.05 budget, B is excluded before preferences are considered. With a 60-second deadline, A's current estimate does not support the target. Neither estimate is automatically a completion guarantee.

C is not automatically the winner. The caller must establish compatible inputs and parameters, permitted access, commercial rights, freshness, output suitability and any transfer charges. A hash is not permission, and reuse is not inherently free.

Suppose the caller also requires confidentiality. Unknown confidentiality or required rights fail eligibility, even if another dimension looks attractive. If no candidate meets the hard rules, the correct result is no eligible option. The agent can ask for a permitted change; it cannot silently weaken the task.

This example illustrates a decision procedure, not a universal scoring formula. Different tasks can choose differently from the same records.

## 5. Eight feature groups

The primary SPPA model organizes information into eight groups. These are responsibilities, not eight transports or an increasing trust ranking.

| Group | The agent's question | Representative information |
| --- | --- | --- |
| G1 — Capability & Contract | Can it do the job? | Semantic inputs/outputs, features, parameters, versions and limits |
| G2 — Policy & Eligibility | Am I allowed to use it? | Privacy, rights, location, permissions and required authority |
| G3 — Runtime & Availability | Is it ready now? | Health, admission, capacity, queue, source and expiry |
| G4 — Offer & Economics | What will this job cost and take? | Bound inputs, charges, ceilings, timing terms and expiry |
| G5 — Execution, Artifact & Reuse | What is happening, and where is the result? | Jobs, owned artifacts, access, revisions and compatible reuse |
| G6 — Evidence & Validation | What actually happened? | Run facts, hashes, receipts, provenance and deterministic checks |
| G7 — Evaluation & Feedback | Does the result meet the goal? | Stated rubrics, judgments and actionable feedback |
| G8 — Reputation & Learning | What should the next agent learn? | Scoped outcomes, samples, prediction accuracy and uncertainty |

The caller-owned **Decision Record** sits between comparison and execution. It is not a ninth group. Policy remains enforced throughout execution, transfer and reuse. Historical evidence can inform a future decision; reuse can be evaluated before new execution.

The [eight-group draft](../spec/feature-groups/0.1.0-draft.1.md) contains the more detailed classification. Historical six-layer material is retained as design history.

## 6. What makes decision data usable

A value without context is easy to misinterpret. The proposed contract attaches identity, scope, source, observation time, expiry and interpretation to relevant claims.

A supported-feature declaration is different from a current observation. An authenticated provider claim is different from an independent measurement. A signed receipt is different from a rubric-based judgment. None automatically outranks the others because of its group number.

Units must be explicit. Monetary values require currency and charge semantics. Timing separates setup, transfer, queue wait, execution and completion. Scores require metric definitions, dataset or task scope, sample counts and uncertainty. Unknown is a valid state; it must not quietly become zero cost, no wait or perfect reliability.

Capability equivalence also requires more than a common MIME type. Two PNG outputs can encode different meanings, color spaces or alpha conventions. Two implementations of one capability may support different subsets of features. Matching must examine the applicable contract and version.

## 7. Job-bound offers and final admission

The proposed offer binds terms to the requested capability version, inputs or committed input metadata, parameters, provider configuration and policy. An offer identifies its issuer, validity window and price semantics. Changed input or expired terms require re-evaluation.

A rate such as cost per minute is not an enforceable total. The caller needs the complete charge model and, for a hard budget, an enforceable maximum. Transfer or setup charges cannot be silently omitted. Simulated terms used in a test must be labeled as test terms.

Selection does not reserve compute. A job-bound quote may become stale before execution. The provider must recheck policy, the bound terms and capacity at atomic admission. If a reservation profile is introduced, its semantics must be explicit rather than inferred from a search result.

Idempotency distinguishes retries of one request from fresh work. An uncertain network response is not a reason to create a second charge or execution. Payment settlement requires its own identity, mandate, idempotency and ledger design; the current reference performs no billing.

## 8. Runtime observations and uncertainty

Operational health and saturation are different. A healthy provider can have no free workers while still admitting FIFO queued work. Conversely, a responsive endpoint does not establish that its execution backend is functioning.

Observations need independently tracked freshness. A current heartbeat must not refresh an old queue reading. Scope is essential: a wrapper's one available slot does not describe the entire machine or an unrelated worker queue.

A caller should distinguish immediate admission, queue-only admission, rejection and unknown readiness. Estimated wait needs a stated method and evidence. Freshness checks alone do not make a prediction accurate.

The Core reference implements health, bounded concurrency and queue admission. A separate experimental runtime profile explores snapshot/heartbeat freshness and ordering. Native event subscriptions and complete Hub integration of that profile remain future work.

## 9. Artifacts, evidence and evaluation

Bulk bytes travel through artifact transfer paths, not ordinary decision JSON. An artifact reference is ownership-bound and accompanied by size, media type and integrity metadata. The access policy determines who may retrieve or reuse the bytes.

Execution evidence records what a provider asserts occurred. The Core reference signs receipts with Ed25519 and canonical JSON, binding provider, caller, job, capability, parameters and input/output identities and hashes. A valid signature establishes authenticity of that signed statement, not independent truth about every claim.

Validation asks deterministic questions: does the file decode, is the requested codec present, are dimensions preserved, is an alpha channel present, do downloaded bytes match the declared hash? Evaluation asks whether the result meets the goal under a stated rubric. A valid transparent PNG can still contain an unsatisfactory foreground mask.

Feedback should retain its rubric and task context. Reputation should summarize eligible records, including unresolved outcomes and uncertainty. One average quality score is not a substitute for comparable evidence. Self-reported or collusive feedback remains a threat that an eventual reputation design must address.

## 10. Reuse and composition

Reuse can avoid redundant computation, but only after an authorized compatibility check. The lookup itself must not reveal the existence of private inputs or outputs to an unauthorized party. Result equality, access rights, source licenses, current requirements and any charges must be considered separately.

Composition connects capabilities by semantic contracts. The agent checks whether one result is suitable input for the next transformation. Matching file extensions alone is insufficient. Cross-provider transfer requires explicit authority; a known reference does not automatically delegate credentials or grant access.

Revision, rollback, authorized reuse and general semantic composition are proposed lifecycle features. The current implementation does not claim these features are complete.

## 11. Reference architecture and autonomy

The intended flow is:

```text
Human task + owner authority
        |
        v
Main AI -> Hub or private discovery -> candidates and decision context
        |
        v
Main AI chooses + records reasons
        |
        v
Declared execution binding -> provider atomic admission -> worker
        |
        v
Owned artifact -> validation + evidence -> evaluation -> next decision
```

Hub supports discovery; it is not required to remain in the execution path. The current Hub also offers an explicit opt-in gateway. Direct provider execution is separately demonstrated.

The proposed domain split is `sppahub.org` for the position paper, specification and evidence, and `sppahub.com` for the reference service. These are planned domain roles, not currently deployed public services.

A short human prompt should be enough to locate the service. Agents then follow machine discovery for authentication, account, search and billing interfaces. Automation remains bounded by an owner's standing grant and spending limit. An agent cannot create payment authority by writing its own prompt or silently change a denied requirement. Account enrollment and billing are planned service work, not implemented protocol claims.

## 12. What the current proof establishes

Private development on 5 October 2026 demonstrates two separately running FFmpeg provider endpoints: one local runtime and one runtime using the installed remote Docker FFmpeg through an operator-pinned SSH adapter. A third provider uses an installed background-removal model. The adapters invoke existing runtimes; they do not consume the workers' shared RabbitMQ queue.

The reproducible [Hub remote demo](https://github.com/theparitt/sppa-hub/blob/main/scripts/demo-remote.mjs) exercises:

- Scoped agent authentication and structured discovery.
- Caller selection between two implementations of the same `video.transcode@1.0.0` contract.
- Real H.264 results from both deployments, with 64 × 64 fixture dimensions checked using ffprobe.
- Background-removal output decoded as 1536 × 1024 RGBA PNG, with a non-opaque alpha range.
- Owned artifact transfer, caller hash checks and context-bound signature verification.
- Completion and direct download after stopping the demo's Hub process.

These are functional development observations on small fixtures. The two video providers share FFmpeg; they are not independent organizations. The BG run uses the installed base model on CPU. Its fast checkpoint was unreadable and was not replaced. The reported capacity is wrapper capacity; total remote machine or GPU load is unknown.

The proof does **not** establish comparative quality, prediction accuracy, cost savings, third-party interoperability, production security or a public provider network. No real job-specific prices, MCP calls, automated billing, reuse or reputation history are demonstrated. Provider jobs, keys and artifact storage remain ephemeral.

## 13. Evaluation agenda

A convincing decision-standard experiment needs more than successful execution.

Compare provider-specific descriptions against normalized SPPA records under the same tools, model, task inputs and authority. Measure constraint violations, task success, no-eligible outcomes, selection regret under a stated objective, decision latency and information acquisition overhead. Record model and prompt versions and repeat trials.

Construct real queue load rather than inventing it. Compare predicted and actual wait, execution and completion timing. Vary input size, congestion and worker availability. Test stale observations, expired offers, contradictory sources and unknown required rights.

For cost experiments, use controlled, enforceable test ceilings first. Clearly separate simulated billing from actual charges. Verify idempotent settlement under interrupted responses before making any monetary claim.

For quality comparisons, publish a relevant rubric, dataset, evaluator provenance and sample uncertainty. Do not compare scores from incompatible tasks. Background-removal structure checks are not a perceptual benchmark.

Finally, have independently authored callers and providers implement a pinned draft. Measure disagreements in interpretation, migration effort and extension behavior. Publish reproducible evidence only after an owner-approved release.

## 14. Risks and open questions

Normalized fields can create false confidence if their meanings, sources or freshness are wrong. Capability names can drift; providers can overstate features. Agents can misread policy, trust instruction-bearing tool content or optimize an inappropriate metric.

A registry can expose private information or become a dependency even when the protocol intends it to be optional. Durable identities, key rotation, revocation, artifact retention, resource quotas, execution isolation and recovery need operational work beyond a small reference.

The decision layer must justify its maintenance and negotiation overhead. For a single trusted tool, provider-specific metadata may be sufficient. Standardization is most valuable when independent implementations benefit from common meanings; that value must be demonstrated.

Open questions include capability governance, offer enforceability, privacy-preserving historical aggregation, evaluation provenance, bounded extension rules and reconciliation across execution bindings. The current draft offers a direction and testable requirements, rather than claiming those questions are solved.

## 15. Status, sources and next steps

This paper is the conceptual entry before the specification. It does not amend the exact Core wire contracts or turn proposed requirements into implemented features.

The canonical authored source is `docs/position-paper.md` in the private protocol repository. Both the latest paper page and the versioned page render this source for 0.1-draft.1. A later numbered edition must preserve this edition's source before advancing the latest document. Commit history remains available for draft corrections.

Related authored material:

- [SPPA concept](../design/concept.md)
- [Architecture and execution bindings](../design/architecture.md)
- [AI Decision Contract](../design/decision-contract.md)
- [Eight feature groups](../spec/feature-groups/0.1.0-draft.1.md)
- [Core 0.1.1 overview](../spec/0.1.1/overview.md)
- [Conformance](../spec/0.1.1/conformance.md)
- [Private launch plan](private-launch-plan.md)

External technical source: [MCP Tools, 2025-11-25 specification](https://modelcontextprotocol.io/specification/2025-11-25/server/tools). The comparison here addresses architectural roles, not superiority or measured performance.

The next milestone is executable job-bound decision terms and a reproducible selection experiment. Public publication, domain activation and a production launch remain separate owner decisions.

