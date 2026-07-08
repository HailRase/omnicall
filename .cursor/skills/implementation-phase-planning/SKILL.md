---
name: implementation-phase-planning
description: SKILL - Use when preparing work for an implementation phase or splitting tasks across agents.
---

# SKILL: Implementation Phase Planning

Use this skill before assigning or starting a roadmap phase.

The goal is to give agents a precise start point, scope, sequence, and completion gate.

## Inputs

- roadmap phase
- affected `LF-XXX` IDs
- current repository state
- completed previous phases
- Feature Registry
- architecture rules
- UX blueprint

## Outputs

- phase objective
- task breakdown
- dependency order
- agent prompts
- expected files
- tests required
- phase gate
- risks

## Procedure

1. Read the phase in `Implementation-Roadmap.md`.
2. Confirm previous phase gate is complete.
3. List all `LF-XXX` IDs for the phase.
4. Group IDs by bounded context.
5. Split work into agent-sized units.
6. Order units by dependency:
   - Domain
   - Application
   - Ports
   - mock adapters
   - projections
   - UI
   - real adapters
7. Define expected tests per unit.
8. Define UX deliverables for user-visible units.
9. Define verification commands.
10. Draft a precise agent prompt.

## Work Unit Template

```txt
Implement <phase/task name>.

Read:
- docs/softphone/MASTER_SYSTEM_PROMPT.md
- docs/softphone/Architecture-Constitution.md
- docs/softphone/Legacy-Feature-Coverage.md
- docs/softphone/Implementation-Roadmap.md
- docs/softphone/UX-UI-Design-Blueprint.md

Scope:
- Phase: <PXX>
- Legacy IDs: <LF-XXX list>
- Context: <context>
- Layer focus: <Domain/Application/Ports/etc>

Start with:
- Domain Events
- state transitions
- Use Case tests

Do not:
- call adapters from UI
- introduce legacy operator platform dependency into core telephony
- skip Feature Registry updates
```

## Risk Checklist

Flag risks:

- phase depends on unfinished previous phase
- UI requested before Domain/Application exists
- real adapter requested before mock tests
- legacy operator platform feature could break SIP-only mode
- host API compatibility is unclear
- UX error state is missing
- tests require real external infrastructure

## Completion Gate

Phase planning is complete when:

- each `LF-XXX` has a work unit
- each work unit has test expectations
- each UI work unit has UX states
- each adapter work unit has a port
- agent prompts are specific enough to execute
