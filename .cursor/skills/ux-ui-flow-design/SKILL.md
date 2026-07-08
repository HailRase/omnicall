---
name: ux-ui-flow-design
description: SKILL - Use before implementing any visible Electron or React softphone flow.
---

# SKILL: UX/UI Flow Design

Use this skill before building UI components, layouts, modals, panels, and Electron shell behavior.

The goal is to design states and interactions before writing React code.

Read `docs/softphone/UI-Architecture.md` for renderer layering (shells, hooks, components).

## Inputs

- affected `LF-XXX` IDs
- user flow
- roadmap phase
- UX blueprint
- Domain projections
- Use Cases
- accessibility requirements

## Outputs

- state inventory
- wireframe-level layout
- component list
- props and callbacks
- disabled-state rules
- error and recovery copy
- accessibility checklist
- test scenarios

## Procedure

1. Identify affected `LF-XXX` IDs.
2. Identify user goal.
3. Identify Domain/Application projection inputs.
4. Identify user actions and target Use Cases.
5. List visual states.
6. List loading states.
7. List error states.
8. List disabled states and reasons.
9. Define layout.
10. Define components.
11. Define props and callbacks.
12. Define accessibility behavior.
13. Define test IDs.
14. Define UI tests.

## Required State Inventory

For every flow define:

- default state
- loading state
- success state
- empty state
- error state
- disabled state
- reconnect/recovery state when relevant
- shell layout states when relevant

## Softphone-Specific UX Checks

Verify:

- call state is always visible
- incoming call is never hidden behind secondary UI
- active call controls remain reachable
- connection loss is visible and actionable
- legacy operator platform-only controls hide in SIP-only mode
- transfer mode is visually explicit
- disabled controls explain why
- critical actions are keyboard accessible

## Component Boundary

Components receive:

- projections
- callbacks
- labels
- disabled reasons

Components do not receive:

- raw SIP sessions
- raw WebSocket messages
- Electron objects
- repositories
- adapters

## Accessibility Checklist

Each flow must include:

- keyboard navigation
- visible focus
- accessible labels
- non-color-only status indication
- safe contrast
- predictable modal focus
- escape/close behavior when allowed

## Completion Gate

UX flow design is complete when:

- states are listed
- components are named
- callbacks map to Use Cases
- disabled reasons are defined
- accessibility is covered
- tests are described
- no component owns business logic
