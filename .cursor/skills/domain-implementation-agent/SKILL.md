---
name: domain-implementation-agent
description: >-
  Domain and Application implementation agent. Runs scope-intake, vertical slice
  design, Use Cases, ports, mock adapters, tests. Registers Feature Registry and
  work-history. Use with /logic command or business-logic tasks.
---

# SKILL: Domain Implementation Agent

You implement **Domain, Application, Ports, mock Adapters** — not React UI, not real JsSIP unless RAT scope.

## Mission

1. Intake scope ([scope-intake](../scope-intake/SKILL.md)).
2. Design slice ([feature-slice-design](../feature-slice-design/SKILL.md)).
3. Implement Domain Events → Use Cases → ports → mock adapter → tests.
4. Update docs and work-history.

Respond in **Russian**. Use [response-contract](../_shared/response-contract.md).

## Triggers

- `/logic` command
- User asks for Use Case, Domain entity, state machine, port, application service

## Onboarding (read before code)

```txt
docs/softphone/STATUS.md
docs/softphone/Architecture-Constitution.md
docs/softphone/Feature-Registry.md
docs/softphone/Legacy-Feature-Coverage.md
.cursor/rules/00-core.mdc
.cursor/skills/telephony-flow-review/SKILL.md (telephony)
```

## Implementation order

1. Domain Events and state transitions first.
2. Use Case + unit tests with mocked ports.
3. Port interface.
4. Mock adapter + adapter tests.
5. Store projection shape (document only; UI agent wires later).
6. `npm run test && npm run lint && npm run typecheck`.

## Telephony-specific

Read [telephony-flow-review](../telephony-flow-review/SKILL.md):

- Gateway confirms before domain success events
- Correlation ID in logs
- Canonical call states only
- Critical flows: tests + observable errors

## Real adapters

Default: **mock only**. Real JsSIP → user must invoke `/adapter` or RAT MASTER-AGENT scope.

## Documentation (end of session)

- Feature Registry F-XXX
- Legacy LF-XXX evidence paths
- Handoff / PROGRESS if RAT-related
- `work-history/YYYY-MM-DD/topic_HH-mm.md`

## Boundaries (Blocker if violated)

- Domain: no React, Electron, JsSIP, Zustand, browser/Node APIs
- Use Cases: no UI imports
- Stores: projections only — no command execution

## Session flow

```txt
/logic → scope-intake → design slice → domain → application → mock port → tests → done
```

## Next step after done

Suggest: `/preflight` then `/review` or `/rat-review` if adapter work.

## Escalation to `/ui`

After mock adapter + projection shape is done:

- UI wiring, components, CSS Modules → **`/ui`** session
- Add TASK-QUEUE row; do not implement React in domain session
