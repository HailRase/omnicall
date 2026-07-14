---
name: legacy-feature-migration
description: SKILL - Use when migrating any behavior from the audited legacy softphone to the new Electron platform.
---

# SKILL: Legacy Feature Migration

Use this skill whenever work touches legacy parity.

The goal is to migrate behavior without losing any `LF-XXX` feature.

## Inputs

- User request
- `Legacy-Feature-Coverage.md`
- `Implementation-Roadmap.md`
- affected legacy modules
- current implementation phase
- existing Feature Registry entries

## Outputs

- affected `LF-XXX` IDs
- legacy behavior summary
- new architecture target
- Use Cases
- Domain Events
- ports and adapters
- UX states
- tests
- parity checklist

## Procedure

1. Find all affected `LF-XXX` rows.
2. Read their phase, context, priority, old modules, and acceptance focus.
3. Read the matching phase in `Implementation-Roadmap.md`.
4. Identify old behavior that must be preserved.
5. Identify old coupling that must not be preserved.
6. Map old modules to new layers.
7. Define Domain Events.
8. Define Use Cases.
9. Define ports.
10. Define mock adapter behavior.
11. Define UI projections and UX states.
12. Define tests.

## Mapping Guide

Old `DisplayProvider` responsibilities must split into:

- Call Engine
- Telephony Gateway
- Media Service
- call projections
- host integration adapter
- UI hooks

Old `useWs` responsibilities must split into:

- legacy operator platform gateway
- operator Use Cases
- typed message parser
- reconnect policy
- operator projections

Old `window.Softphone` embed API must **not** be ported. External tab behavior moves to:

- `ExternalClientGateway` + `ExternalCommandRouter` (future)
- typed external command contracts (`OcpHostApiContract` for OCP)
- Facade / Use Cases with `callType: 'external' | 'sdk'`

Old headset orchestration must move to:

- `HeadsetGateway`
- headset Domain Events
- application command mapping
- UI sync projection

## Preservation Checklist

Preserve:

- user-visible behavior
- external contracts
- call lifecycle semantics
- legacy operator platform message semantics
- status transition rules
- settings behavior
- error and recovery states

Do not preserve:

- god providers
- untyped globals
- raw `CustomEvent` business flow
- direct JsSIP in React
- direct storage in UI
- business rules in stores

## Completion Gate

Migration is complete only if:

- all affected `LF-XXX` IDs are listed
- acceptance focus is implemented
- tests cover success and failure
- UX states exist for visible behavior
- architecture boundaries are preserved
- Feature Registry links to legacy IDs
