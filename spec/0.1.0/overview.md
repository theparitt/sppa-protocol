# SPPA Core

A common contract for specialized software used by AI agents.

**Version 0.1.0 | Working draft | 3 October 2026**

This is an implementable project specification, open for review. It is not an
IETF, ISO, W3C or independently ratified standard. Implementations should pin a
repository commit while this draft is changing. No production certification is
claimed by the reference implementation.

## The model

**SPPA** means **Specific Purpose Platform/App**: a specialized application or
service primarily designed for external AI to use. It does not have to contain AI.
A capability is a high-level operation such as `video.transcode`.
SPPA Protocol describes the shared contract; SPPA Hub is a reference service
for discovery, comparison, monitoring and trust. A provider MUST function with
direct discovery or a private registry, without contacting a public Hub.

```text
Human intent -> Caller AI -> Discover capabilities -> Choose provider
                                                      |
                                         Transfer / invoke / monitor
                                                      |
                                              Provider execution
                                                      |
                                            Immutable output artifact
                                                      |
                                               Next SPPA or human
```

Providers choose their own language, runtime, hardware and infrastructure.
Bleepwave and RabbitMQ can implement a provider; they are not Hub or protocol
requirements. Jev can implement a judge; the contracts remain evaluator-neutral.

## Core scope

Core 0.1.0 covers Discovery, Capability, Constraints, Invocation/Job, Artifact,
Transfer, Policy, Security, Monitoring, Error, Execution Receipt and Versioning.
The initial binding is `core.http-artifact`: HTTPS JSON control messages,
async artifact jobs, direct uploads/downloads, SHA-256 integrity and signed receipts.
It deliberately has one testable mandatory profile.

Session/revision/review, result validation/evaluation, feedback and reputation
are planned for 0.2. Streaming/events/composition/negotiation/payment and advanced
transfer profiles are planned for 0.3. A provider MUST NOT advertise an undefined
profile as supported. Existing application pipelines can still use output artifacts
as subsequent inputs through the Core transfer flow.

## Normative language and precedence

MUST, MUST NOT, SHOULD, SHOULD NOT and MAY express requirements in the sense of
[RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) and
[RFC 8174](https://www.rfc-editor.org/rfc/rfc8174) when capitalized.
Normative rules live in these specification chapters and the versioned schemas.
Examples are informative. A schema validates shape, not every semantic/security
rule. A disagreement between prose and schema is a specification defect and
MUST be reported; implementations MUST NOT silently choose incompatible behavior.

## What is deliberately absent

Core does not define a commercial marketplace, provider implementation language,
new transport, arbitrary shell interface, public-registry dependency, global
star score, payment processor or automatic subjective judge. Typed operations
and verifiable execution evidence are the foundation for later work.
