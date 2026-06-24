# Enterprise Softphone Agent Prompts

## Type

DOCUMENT.

This document provides reusable prompts for future implementation agents.

## Prompt Rules

- Every prompt must name the roadmap phase.
- Every prompt must name affected `LF-XXX` IDs.
- Skip Operator/OCP `LF-XXX` unless user resumes `OCP-PLUGIN-BACKLOG.md` (ADR-0002).
- Every prompt must mention architecture boundaries.
- Every prompt must require tests.
- Every UI prompt must require UX state design first.
- Every adapter prompt must require ports and mock tests first.

## Prompt: Start Phase

```txt
You are implementing Enterprise Softphone roadmap phase <PXX>.

Read first:
- docs/softphone/MASTER_SYSTEM_PROMPT.md
- docs/softphone/OCP-PLUGIN-BACKLOG.md (OCP deferred — skip Operator work unless resumed)
- docs/softphone/Architecture-Constitution.md
- docs/softphone/Engineering-Principles.md
- docs/softphone/Feature-Registry.md
- docs/softphone/Legacy-Feature-Coverage.md
- docs/softphone/Implementation-Roadmap.md
- docs/softphone/UX-UI-Design-Blueprint.md

Scope:
- Phase: <PXX phase name>
- Legacy IDs: <LF-XXX list>
- Primary context: <context>

Required order:
1. Domain Events
2. State transitions
3. Use Cases
4. Ports
5. Mock adapters
6. Projections
7. UI flow
8. Real adapters

Do not bypass Call Engine.
Do not import infrastructure into Domain.
Do not put business rules in React or stores.
Preserve SIP-only mode when OCP is involved.
Update Feature Registry and tests before finishing.
```

## Prompt: Implement One Legacy Cluster

```txt
Implement the legacy feature cluster <cluster name>.

Legacy IDs:
- <LF-XXX>
- <LF-XXX>

Read:
- docs/softphone/Legacy-Feature-Coverage.md
- docs/softphone/Implementation-Roadmap.md
- docs/softphone/Architecture-Constitution.md

For each LF ID:
1. Restate old behavior.
2. Identify old modules.
3. Map behavior to new layers.
4. Define events and Use Cases.
5. Define tests.
6. Implement only the required slice.

Keep OCP optional.
Keep UI presentational.
Keep stores as projections.
```

## Prompt: UX/UI Flow Design

```txt
Design the UX/UI flow for <flow name>.

Legacy IDs:
- <LF-XXX>

Read:
- docs/softphone/UX-UI-Design-Blueprint.md
- docs/softphone/Implementation-Roadmap.md

Output before code:
- state inventory
- wireframe-level layout
- component list
- props and callbacks
- disabled reasons
- loading/error/recovery copy
- accessibility checklist
- test scenarios

Only after this, implement React components.
Components must not contain business logic.
Callbacks must map to Use Cases.
```

## Prompt: Telephony Use Case

```txt
Implement telephony Use Case <UseCaseName>.

Legacy IDs:
- <LF-XXX>

Read:
- docs/softphone/Architecture-Constitution.md
- docs/softphone/Implementation-Roadmap.md
- .cursor/skills/telephony-flow-review/SKILL.md

Start with:
- command input type
- Domain Events
- valid state transitions
- invalid state transitions
- normalized errors
- Use Case unit tests

Use a mocked TelephonyGateway first.
Do not call JsSIP directly from UI, stores, or Domain.
```

## Prompt: Adapter Implementation

```txt
Implement adapter <AdapterName>.

Legacy IDs:
- <LF-XXX>

Preconditions:
- port exists
- Use Case exists
- mock adapter tests pass
- external payload schema is defined

Requirements:
- validate external input as unknown
- map external events to Domain Events
- map application commands to external calls
- normalize errors
- log with correlation IDs
- avoid leaking external objects through ports
```

## Prompt: Parity Review

```txt
Review legacy parity for <phase or feature>.

Read:
- docs/softphone/Legacy-Feature-Coverage.md
- docs/softphone/Implementation-Roadmap.md
- docs/softphone/Feature-Registry.md

Check:
- every affected LF ID is implemented
- acceptance focus is satisfied
- tests exist or deferral has ADR
- UX states exist for visible behavior
- OCP mode works when relevant
- SIP-only mode still works
- external contracts remain compatible

Return only findings, missing coverage, and required follow-up.
```
