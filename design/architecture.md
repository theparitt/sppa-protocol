# SPPA architecture: the semantic decision layer

**Design direction · 2026-10-03 · Proposed, not an implemented wire release**

**SPPA is a machine-first semantic capability and decision standard that gives
AI agents normalized information to discover, compare, select, and compose
software capabilities across providers.** This defines the proposed standard;
it remains a working design, not a ratified standard.

SPPA means **Specific Purpose Platform/App**: specialized software exposed as a
capability that an AI agent can use. SPPA Protocol supplies the shared semantic
and decision contracts. SPPA Hub is a separate reference discovery and comparison
service. The main AI decides which provider to use. The standard is independent
of MCP; execution can use MCP, HTTP, or another declared binding.

## Two core contracts

**Semantic Capability + AI Decision Contract** are the center of SPPA.

A semantic capability states what result software can provide, with a versioned
contract for input, output, features, parameters, and limitations. The AI Decision
Contract supplies enough normalized context to decide which eligible provider to
use for the current goal: technical fit, operations, quality, economics, policy,
trust, and reuse. The caller's priorities determine the choice.

SPPA does not only describe how to call software. It describes enough context
for AI to decide whether it should call that software.

Humans supply intent and receive outcomes. AI agents are the operational callers
throughout the lifecycle. Human-facing pages explain and inspect the system; they
are not a manual application workflow for using each provider.

## Eight feature groups and the caller decision

The primary [feature-group specification](/sppa-protocol/spec/feature-groups/0.1.0-draft.1/)
organizes Capability & Contract, Policy & Eligibility, Runtime & Availability,
Offer & Economics, Execution/Artifact/Reuse, Evidence & Validation,
Evaluation & Feedback, and Reputation & Learning.

The caller-owned Decision Record binds the selected provider/offer, hard requirement
outcomes, priorities, evidence and reasons. It is not a ninth group or a provider's
choice. The Hub supplies a decision surface; main AI selects under human authority.
Privacy, permissions and required rights cannot be averaged into preference scores.

Execution returns authorized artifacts. Checks produce evidence; evaluator judgments
remain distinct. Aggregated experience can inform the next caller's choice:

```text
Capability -> Policy -> Runtime -> Offer -> Main AI decision
  -> Execution / Artifact / Reuse -> Evidence -> Evaluation -> Reputation
  -> next decision's context
```

Policy remains enforced after selection, at execution, transfer, revision and reuse.
Reuse can be evaluated before deciding to execute new work. Group order is not a
mandatory timing sequence or trust hierarchy. The original six-layer draft is
retained as history; Core artifacts remain unchanged. Full offers, session/reuse,
evaluation, reputation and automatic learning pipelines are still proposed.

## The lifecycle

**Discover → Select → Run → Monitor → Evaluate → Rate → Compose**

The caller starts with a goal, discovers semantic capabilities, checks hard
requirements, compares eligible offers, chooses a provider, runs the work,
monitors it, evaluates the output, submits evidence-backed feedback, and passes
an authorized result to the next capability. The provider can be FFmpeg, a
compiler, an enterprise service, or a GPU model without any agent inside it.

This describes the intended lifecycle. Evaluation, reputation, reuse, and
cross-provider composition are not implemented in the current reference.

## Responsibilities

| Party | Responsibility |
| --- | --- |
| Human | Supplies goals, permissions, and spending authority; receives outcomes |
| Main AI | Supplies requirements, selects the provider, evaluates output, and plans subsequent steps |
| SPPA protocol | Defines semantic capabilities, comparable offers, policies, evidence, and artifact meaning |
| Hub or private registry | Discovers, filters, normalizes, and returns candidates with evidence and unknowns |
| Execution binding | Maps the selected offer to calls, authenticated identity, task handling, and results using MCP, HTTP, or another transport |
| Provider | Publishes truthful terms, enforces authorization and admission, runs software, returns results |

A Hub may return dimensions or caller-requested ordering. It does not silently
make the caller's final choice. Direct providers and private registries remain
valid; a public Hub is not required.

## Transport-independent semantics

The semantic and decision contracts are defined independently of execution
plumbing. Neither MCP nor a public Hub is required to interpret a capability,
compare offers, or apply eligibility rules. SPPA is not defined as "MCP plus
more data" or as an MCP-only extension.

The flow is human intent → main AI → capability discovery → provider offers →
decision surface → main AI chooses → MCP / HTTP / other transport → provider →
result. Direct provider discovery or a private registry can replace public Hub.

Each execution binding declares its protocol and version, endpoint and tool or
operation mapping, identity/authentication, authority propagation, offer and
request correlation, task/result handling, and artifact transfer. It must preserve
SPPA's capability version, hard policy requirements, terms, and evidence without
silently translating them to weaker guarantees. Unsupported requirements fail
explicitly. A transport that executes a job does not by itself implement the
AI Decision Contract.

Reuse existing connection and execution standards. SPPA's semantic core does
not define a new universal RPC, OAuth system, or asynchronous task transport.
The published HTTP reference is one existing binding experiment; an MCP binding
is a planned option, not a prerequisite for the independent standard.

## MCP as an execution binding

[MCP tools](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)
define structured tool invocation. The MCP
[authorization framework](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization)
applies to HTTP transports; local transports have different credential handling.
[MCP Tasks](https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/tasks)
are experimental and must be negotiated at both server and tool level. A binding
must pin a tested MCP version and declare task support instead of assuming it.

The [MCP Registry](https://modelcontextprotocol.io/registry/about) already
supports server discovery. SPPA adds capability semantics and a proposed
cross-provider decision contract, rather than claiming that discovery is absent.

**MCP helps AI use software. SPPA gives AI the information it needs to choose
the right software.** This explains their different roles when used together;
it does not make MCP a dependency of SPPA.

Bulk artifact transfer can use authorized HTTPS/object-store mechanisms. MCP
can carry descriptors; SPPA defines their identity, semantic role, lineage,
rights, and integrity. SPPA does not invent a new byte-transfer transport.

## What SPPA standardizes

| Contract | Question it answers |
| --- | --- |
| Semantic capability | What result does this software provide? |
| Capability contract | What inputs, outputs, features, parameters, limits, and guarantees apply? |
| Provider offer | What terms apply to this particular job, now? |
| AI Decision Contract | Which candidates satisfy the requirements, and how do eligible offers compare? |
| Policy and rights | Is this caller allowed to perform this use with these inputs and outputs? |
| Evidence and reputation | Who measured what, under which conditions, and with what confidence? |
| Reuse | Can this caller use an existing result without another execution? |
| Artifact semantics | What does the result mean, where did it come from, and may it be passed onward? |
| Composition | Is the next capability compatible with meaning, rights, policy, and format? |

Identical capability names alone do not establish substitutability. Versions,
feature requirements, parameter semantics, input/output meaning, and evaluation
criteria must agree. Cross-provider composition must explicitly transfer or
authorize the artifact; an opaque reference is not a public download link.

## Licensing and side effects belong in eligibility

Separate the wrapper license from underlying software/model terms, permission
to host the service, input rights, and output-use restrictions. Required rights
have three states: allowed, denied, or unknown. Unknown does not satisfy a hard
requirement. An SPDX expression is a license description, not proof that an
operator holds all required permissions.

Provider declarations and independent verification must be distinguishable.
Verification requires an identified trusted verifier, scoped evidence, the
reviewed terms revision, and freshness. A provider cannot gain verified status
by setting a boolean in its own metadata.

Side effects are described as none beyond job artifacts, local changes outside
the job, external actions, or irreversible actions. Declarations state affected
resources and required permissions. Executing an external or irreversible
action requires explicit caller authority; metadata is not itself permission.

The repository's Apache-2.0 license does not relicense installed FFmpeg. FFmpeg
licensing depends on the actual build and enabled components; its
[official legal page](https://ffmpeg.org/legal.html) explains the distinctions.
The reference does not distribute an FFmpeg binary or certify operator rights.

## Transition from the existing proof

Core 0.1.0 and 0.1.1 are published snapshots of an earlier HTTP experiment.
Their schemas, envelope, job endpoints, and OpenAPI binding remain reproducible.
They are not MCP bindings and are not retroactively declared to implement the
full decision standard. They remain valid HTTP reference experiments. New
decision contracts are transport independent; a binding maps them to existing
execution mechanisms without conflating decision semantics with transport.

1. Review the [AI Decision Contract](../decision-contract/) first: hard
   requirements, offers, normalized dimensions, and evidence scope.
2. Publish separate versioned semantic schemas and examples after review,
   with Semantic Capability and AI Decision Contract as the core pair.
   Never insert new required fields into an existing exact wire version.
3. Map the contracts to declared execution bindings. An MCP provider binding
   around the existing FFmpeg executor is a planned demonstration option.
   Use MCP tools and negotiated Tasks; preserve admission and artifact checks.
4. Prove that the same semantic capability and decision requirements survive
   execution through different bindings. For MCP, test an actual client,
   unsupported task capability, denied permissions, stale offers, and failures.
5. Add independent provider comparison, evaluation, feedback, reputation, reuse,
   and composition in stages. Hub application code stays in `sppahub`.

## Evidence required before claiming an advantage

Measure time to first successful result, caller setup steps, tool calls,
tokens/context used, success and retry rates, and provider-switch/composition
success on equivalent tasks. Include transfer and queue time and disclose the
baseline environment. No performance savings are measured by the current demo.

The intended advantage is less repeated integration work when a suitable
capability already exists. Installed local tools can be faster; local-only data
must stay local; custom jobs still require implementation when no suitable
capability exists.
