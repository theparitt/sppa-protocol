# SPPA Concept

**Foundational concept · 2026-10-03 · Working draft**

## Definition

**SPPA is a machine-first semantic capability and decision standard that gives
AI agents normalized information to discover, compare, select, and compose
software capabilities across providers.**

Its two core concepts are **Semantic Capability + AI Decision Contract**.

SPPA describes what software can do and enough context for an AI agent to decide
whether, when, and from which provider to use it. Execution can use MCP, HTTP,
or another declared binding. Neither MCP nor a public SPPA Hub is required.

The name expands to **Specific Purpose Platform/App**. An SPPA provider exposes
specialized software through capabilities. SPPA Protocol defines shared meaning
and decision information; SPPA Hub is a separate reference discovery and
comparison service. The provider may contain no AI at all.

## Purpose

**Humans give intent. AI finds capabilities, chooses providers, and combines
results. Providers do the specialized work. Humans receive the outcome.**

The operational interface is designed for AI agents throughout the lifecycle.
Humans supply goals, authority, and constraints; they do not need to operate each
provider as a separate application. Human-facing websites and documents explain
and inspect the system for builders, operators, and reviewers.

The main AI should spend its reasoning on the overall goal. When a suitable
capability already exists, it should not have to repeatedly install dependencies,
learn application-specific commands, infer limits from manuals, or guess where
an output was written.

## The problem

Being able to call a tool does not establish that it is the right tool for a job.

If five providers offer `image.to_3d`, their shared capability name is only a
starting point. Their features, output semantics, price, queue, expected runtime,
privacy terms, rights, reliability, and evaluation evidence may differ. A caller
needs comparable information, not just a list of names or convincing descriptions.

SPPA addresses two related gaps:

1. **Meaning:** describe a specialized result independently of application names,
   internal commands, programming languages, and infrastructure.
2. **Decision context:** expose consistent, scoped information so an agent can
   determine eligibility and choose among providers for the current goal.

## Semantic Capability

A semantic capability describes the result software can provide. Examples of
possible capability names include `video.transcode`, `audio.separate_stems`,
`image.to_3d`, and `document.extract_tables`. Only `video.transcode` has a working
reference provider in this repository today.

Its capability contract describes input and output meaning, supported features,
parameter semantics, limitations, and declared guarantees. Versions identify the
exact contract. The implementation may use FFmpeg, another video engine, a GPU
model, or a custom service.

A name alone does not make providers interchangeable. A caller must check the
contract version, required features, parameters, and output expectations. Matching
file types also do not establish semantic compatibility: two PNGs can represent
a character reference and a depth map, with very different downstream uses.

## AI Decision Contract

The AI Decision Contract answers: **Which eligible provider should this agent
use for this particular job?**

It combines four distinct objects:

| Object | Meaning |
| --- | --- |
| Capability contract | What the software can do, relatively independently of current load |
| Provider offer | Job-specific terms and observations from a provider, valid for a stated period |
| Machine reputation | Scoped historical measurements with provenance, sample size, and uncertainty |
| Caller decision policy | Hard requirements, authority, and preferences for this goal |

The decision data covers seven groups:

| Group | Examples |
| --- | --- |
| Technical | Features, inputs, outputs, semantic compatibility, limitations |
| Operational | Health, queue, capacity, estimated wait/runtime/completion, observation time |
| Quality | Quality measurements, reliability, validation and composition success |
| Economic | Pricing unit, rate, estimated total cost, currency, enforceable spending limits |
| Policy | Privacy, confidentiality, region, residency, license and commercial-use rights |
| Trust | Verified executions, evidence source, reputation, confidence and sample size |
| Reuse | Authorized existing results, freshness, compatibility and reuse terms |

This is the proposed information model, not a claim that all these measurements
or services already exist in the reference implementation.

## Decision Surface

A **Decision Surface** is the comparable set of eligible offers, observations,
evidence, and unknowns returned to the caller. A Hub can discover, filter,
normalize, and order candidates. **The main AI makes the final choice.**

There is no universally best provider. Priorities vary by task and by the human's
goal. Hard requirements are checked before preferences; a quality or cost score
cannot override a privacy, permission, residency, or rights failure. Unknown
information needed for a hard requirement does not pass.

For example, these are illustrative offers, not live provider measurements:

| Dimension | Provider A | Provider B |
| --- | --- | --- |
| Capability | `image.to_3d` | `image.to_3d` |
| Quality, same benchmark | 0.96 | 0.91 |
| Reliability, same definition/window | 99.5% | 99.8% |
| Estimated total cost | USD 0.18 | USD 0.04 |
| Estimated wait | 40 seconds | 0 seconds |
| Estimated runtime | 50 seconds | 35 seconds |
| Execution region | SG | TH |
| Confidential input | Allowed by declared terms | Allowed by declared terms |
| Commercial use | Allowed by declared terms | Allowed by declared terms |
| Reuse | No matching result | Possible authorized match |

If both satisfy the caller's hard requirements, a speed- and cost-focused agent
may choose B. A quality-focused agent may choose A after reviewing comparable
evidence and its confidence. If residency must be TH, A is excluded regardless
of its quality. A reuse indication requires authorization, integrity, rights,
and freshness checks before it can become a usable result.

These simplified values are insufficient for a production decision by themselves.
Actual offers need identity, contract/configuration scope, observation time,
expiry, and evidence. Estimates are not spending guarantees. A hard budget needs
a binding quote or an enforced cap. Quality requires a defined benchmark,
sample size, and uncertainty; provider claims stay separate from measurements.

## Built for AI, end to end

**Discover → Select → Run → Monitor → Evaluate → Rate → Compose**

| Stage | Agent activity |
| --- | --- |
| Discover | Translate the goal into capability requirements and find candidates |
| Select | Check hard requirements, compare offers and evidence, choose a provider |
| Run | Invoke the selected capability through its declared execution binding |
| Monitor | Track state, deadlines, progress and failures; decide how to continue |
| Evaluate | Check result integrity and whether it satisfies the goal |
| Rate | Submit structured feedback linked to authorized execution and evaluation evidence |
| Compose | Pass an authorized, compatible artifact into the next capability |

A signed execution receipt is distinct from quality evaluation. It binds an
assertion to a signer and execution context; it does not prove that an image is
good, a model is useful, or the human's goal has been achieved.

Composition preserves artifact meaning, provenance, ownership, rights, privacy,
and retention constraints. An artifact reference is not permission to access it.
Cross-provider handoff requires authorized access or transfer.

## Architecture and responsibilities

```text
Human intent and authority
          |
          v
Main AI: goal, requirements, priorities
          |
          v
Hub / private registry / direct provider discovery
          |
          v
Semantic capability + provider offers + scoped evidence
          |
          v
Decision Surface
          |
          v
Main AI chooses
          |
          v
MCP / HTTP / other declared execution binding
          |
          v
Provider executes -> result artifacts + execution evidence
          |
          v
Main AI monitors, evaluates, rates and composes
          |
          v
Human outcome
```

SPPA standardizes semantic and decision information. A provider publishes terms,
enforces authorization and admission, and owns execution. A Hub returns candidates
and evidence; it is not the authority that grants input access or approves
spending. The caller retains responsibility for its choice and granted authority.

Execution bindings reuse existing connection, authentication, call, and task
mechanisms. When MCP is used, the distinction is:

**MCP helps AI use software. SPPA gives AI the information it needs to choose
the right software.**

That distinction does not make SPPA an MCP extension. Different bindings must
preserve the same semantic requirements, terms, identity, and evidence. A binding
must declare unsupported guarantees rather than silently weakening them.

## Intended advantage and limits

The intended advantage is less repeated setup and integration work for the
calling agent, and better-informed selection among existing capabilities. A
remote provider can offer software or compute that the caller's machine lacks.
Comparable contracts can help the caller switch providers without relearning
the meaning of the capability.

These are design goals to measure, not established performance results. The
current proof does not demonstrate token, speed, cost, or quality improvements.
Network transfer, authentication, discovery, and queueing add overhead. An
installed local tool can be faster, confidential data may require local execution,
and a custom task still needs implementation when no suitable capability exists.

Success should be evaluated through time to first successful result, caller setup
steps, tool calls, reasoning/context usage, retries, provider-switch success,
and authorized composition success on equivalent tasks.

## Current status and next design work

The Core 0.1.1 HTTP reference demonstrates a real FFmpeg transcode, discovery,
policy checks, jobs, provider admission limits, immutable artifacts, verified
transfers, and signed execution receipts. It uses two processes on one machine
over loopback; it is not a deployed public provider network.

The independent semantic decision standard is a working design. Comparable
offers, machine reputation, licensing/side-effect decision contracts, reuse,
cross-provider composition, and an MCP binding remain proposed work.

This concept is the baseline for reviewing those contracts. Detailed requirements
are in [Architecture & execution bindings](https://theparitt.github.io/sppa-protocol/design/architecture/)
and the [AI Decision Contract](https://theparitt.github.io/sppa-protocol/design/decision-contract/).
The next implementation step is reviewed, versioned semantic schemas and fixtures,
followed by independent provider and execution-binding interoperability proofs.
