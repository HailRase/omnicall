---
name: feature-slice-design
description: SKILL - Use when designing or implementing a new product feature as a vertical slice across UI, Application, Domain, Ports, Adapters, and Infrastructure.
---

# SKILL: Feature Slice Design

Use this skill before implementing a feature.

The goal is to create a narrow, testable vertical slice without leaking infrastructure into Domain.

## Inputs

- Feature Registry entry
- acceptance criteria
- affected bounded context
- user-visible behavior
- external systems involved

## Outputs

- slice boundary
- Domain model changes
- Domain Events
- Use Cases
- Ports
- Adapters
- store projections
- UI components
- test plan

## Procedure

1. Read the Feature Registry entry.
2. Restate acceptance criteria as observable behavior.
3. Identify the primary bounded context.
4. Define Domain Events first.
5. Define state transitions.
6. Define entities and value objects.
7. Define Use Cases.
8. Define required ports.
9. Define adapter responsibilities.
10. Define store projection shape.
11. Define UI interaction points.
12. Define unit, integration, and E2E tests.

## Slice Order

Implement in this order:

1. Domain types and events.
2. State machine.
3. Use Case.
4. Port interface.
5. Mock adapter.
6. Store projection.
7. UI integration.
8. Real adapter.

Do not start with UI or real infrastructure.

## Quality Gate

The slice is valid only if:

- Domain tests run without Electron.
- Use Case tests run with mocked ports.
- UI does not import adapters.
- Store does not execute commands.
- External payloads are validated at boundaries.
- Feature Registry acceptance criteria are covered.

## Anti-Patterns

Reject designs that introduce:

- god service
- god provider
- direct SIP in component
- direct Electron in component
- store as controller
- untyped event bus
- mutable global API spread across files
