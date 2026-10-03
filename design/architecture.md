# SPPA architecture: capability decisions above MCP

**Design direction · 2026-10-03 · Proposed, not an implemented wire release**

SPPA means **Specific Purpose Platform/App**: specialized software exposed as a
capability that an AI agent can use. SPPA Protocol supplies the shared semantic
and decision contracts. SPPA Hub is a separate reference discovery and comparison
service. The main AI decides which provider to use.

Humans supply intent and receive outcomes. AI agents are the operational callers
throughout the lifecycle. Human-facing pages explain and inspect the system; they
are not a manual application workflow for using each provider.

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
| MCP | Provides negotiated connections, tool calls, authentication, task support, and notifications |
| Provider | Publishes truthful terms, enforces authorization and admission, runs software, returns results |

A Hub may return dimensions or caller-requested ordering. It does not silently
make the caller's final choice. Direct providers and private registries remain
valid; a public Hub is not required.

## Reuse MCP execution plumbing

The new direction uses existing MCP facilities instead of specifying another
RPC envelope, version-negotiation mechanism, OAuth replacement, progress
transport, cancellation method, or asynchronous task protocol.

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
They are not MCP bindings and are not retroactively declared to implement this
design. New work follows the boundary above; do not extend the old transport
to implement the decision layer.

1. Review the [AI Decision Contract](../decision-contract/) first: hard
   requirements, offers, normalized dimensions, and evidence scope.
2. Publish separate versioned semantic schemas and examples after review.
   Never insert new required fields into an existing exact wire version.
3. Implement an MCP provider binding around the existing FFmpeg executor.
   Use MCP tools and negotiated Tasks; preserve admission and artifact checks.
4. Prove caller interoperability with an actual MCP client, including
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
