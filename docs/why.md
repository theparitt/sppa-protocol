# Why SPPA?

**A short introduction · 4-minute read**

**Built for AI decisions, not just AI connections.**

An AI agent can connect to several tools and still face a difficult question: which provider should do this particular job?

SPPA proposes shared information for that decision. It describes software by the result it can produce, the conditions under which it may be used, and the evidence behind its claims. The caller AI chooses; the provider executes.

## One capability, three options

Your agent needs `video.transcode`. It can invoke several implementations.

| Candidate | Maximum job charge | Estimated queue wait | Illustrative quality score | Other option |
| --- | --- | --- | --- | --- |
| A | USD 0.03 | 80 seconds | 0.93 | Fresh execution |
| B | USD 0.08 | 5 seconds | 0.96 | Fresh execution |
| C | USD 0.00 under this example's reuse agreement | No execution queue | Not evaluated | Existing result, 0.2-second retrieval estimate |

**How should an AI decide which one to use?**

All values are hypothetical. A and B's quality scores assume one common illustrative rubric; no actual benchmark is reported. Queue wait is not total completion time. C is not inherently free or usable.

If the budget is USD 0.05, B is excluded. If timing is the priority and the budget permits it, B may be more suitable. If C matches the exact input and output requirements, the agent still needs access, reuse rights, freshness and the complete charge terms.

If the input is confidential, the agent must first check whether sending it to each candidate is permitted. Unknown required rights do not pass. A cheaper or faster option cannot compensate for a failed hard rule.

The decision needs context, not simply a list of callable tools.

## Two contracts at the center

**Semantic Capability** says what outcome an implementation can deliver.

An agent asks for video conversion rather than searching for a product name or learning a command-line language. Features, versions, input/output meaning and limits still decide whether two implementations can substitute for each other.

**AI Decision Contract** describes enough scoped information to assess that implementation for this job.

It connects requirements to provider terms, current observations, evidence and the reason for the choice. Information keeps its source and expiry. Unknown stays unknown.

## What changes for an agent?

Before choosing, the agent checks four questions:

1. **Capability:** can it produce the requested result?
2. **Policy:** am I allowed to use it for this input and purpose?
3. **Runtime:** is it healthy, immediately available or queue-only now?
4. **Offer:** what are the bound terms for this exact job?

After choosing, it tracks four more:

5. **Execution:** what is happening, and where is the owned result?
6. **Evidence:** what happened, and which properties can be verified?
7. **Evaluation:** does the result meet the task's goal?
8. **Learning:** what authorized experience can inform the next choice?

These are the eight primary feature groups. Policy continues throughout the lifecycle. The caller's Decision Record connects comparison to execution.

## How does this relate to MCP?

MCP already provides structured tools, descriptions and results. SPPA's proposal is a common meaning for provider decision information across implementations. It does not claim MCP cannot carry that information.

SPPA can use MCP, HTTP or another execution binding. Direct providers and private registries are valid; a public Hub is optional. The decision contract should survive a change in connection technology.

## What works today?

The private reference has two FFmpeg deployments and a background-removal provider. A caller searches, chooses, uploads, runs, retrieves the result and verifies hashes and receipts. A direct provider job can finish after the demo Hub stops.

This establishes a working execution foundation. It does not establish cost savings, comparative quality or a complete decision standard. Binding offers, billing, MCP execution, reputation, authorized reuse and general composition are still planned.

A signature authenticates execution evidence; it is not an output-quality score. An online wrapper does not report the capacity of the whole remote machine.

## Read next

Read the [Position Paper](position-paper.md) for the argument, architecture, limitations and evaluation agenda.

Then inspect the [eight-group draft](../spec/feature-groups/0.1.0-draft.1.md) and [Core reference](../spec/0.1.1/overview.md). The [examples](examples.md) distinguish real tests from hypothetical selection cases.

SPPA is a working draft with a hypothesis to test: can common decision information make autonomous software choice more reliable and less repetitive?

