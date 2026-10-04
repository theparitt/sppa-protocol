# SPPA and Hub architecture

**Main AI chooses. The provider executes.**

```text
Human task + authority
        |
        v
Main AI -> Hub / private registry / direct discovery
        |             |
        |       candidate decision information
        v
Caller decision record
        |
        v
MCP / HTTP / declared execution binding
        |
        v
Provider admission -> specialized worker -> owned artifact
        |
        v
Validation + evidence -> evaluation -> future decisions
```

## Protocol and service have different roles

**SPPA Protocol** defines the shared semantic capability and decision contracts. It remains independent of MCP and of the public Hub.

**SPPA Hub** is a reference service for agent discovery, search and inspection. Providers can run on different infrastructure. The current private Hub adds an explicit gateway; direct provider execution remains valid.

**Provider** owns admission, execution, artifact access and its assertions about the run. The installed runtime is its implementation choice.

## Domain roles

- `sppahub.org`: proposed home for Why, Position Paper, specification, architecture and evidence.
- `sppahub.com`: proposed reference service with one-address agent onboarding.

These domain roles are prepared in source. Public hosting is paused; neither role is claimed as deployed by this site.

## Agent-first operation

The intended human entry is one short prompt pointing at the Hub. The agent follows machine discovery, acquires authorized identity, checks account/billing limits, searches, selects and runs.

The current implementation has operator-provisioned identity and real search/execution. Agent enrollment, billing and binding job offers are planned. Standing authority can support automatic tasks; the agent cannot invent a payment mandate.

## Detailed design

Read [architecture and execution bindings](../design/architecture.md), [AI Decision Contract](../design/decision-contract.md) and [implementation examples](examples.md).

Runtime observations, offer terms, deterministic evidence and AI judgments keep distinct provenance. Search and quotes reserve no compute unless a separately defined reservation contract says so.

