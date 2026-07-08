---
name: softphone-architecture-review
description: SKILL - Use before architectural changes, refactors, new layers, new services, or dependency changes in the Enterprise Softphone Platform.
---

# SKILL: Softphone Architecture Review

Use this skill before changing architecture, creating services, adding adapters, or refactoring feature boundaries.

## Inputs

- User request
- affected files
- Feature Registry entries
- architecture constitution
- existing imports and dependencies

## Outputs

- affected feature IDs
- affected bounded contexts
- affected layers
- boundary risks
- required tests
- required ADR, if any

## Procedure

1. Identify the Feature Registry entry.
2. Identify the primary bounded context.
3. Identify every affected layer.
4. Map current dependencies.
5. Check for forbidden dependencies.
6. Check whether Domain remains framework-independent.
7. Check whether UI bypasses Use Cases.
8. Check whether stores remain projections.
9. Check whether legacy operator platform remains optional.
10. Check whether external libraries remain behind adapters.

## Risk Checklist

Flag the change if it introduces:

- React -> SIP
- React -> Electron
- Domain -> Infrastructure
- Domain -> Zustand
- Store -> adapter
- UI -> repository
- raw external library objects in Domain
- untyped integration payloads
- new global mutation
- circular dependency

## Required Result

Before implementation, produce:

- chosen design
- rejected alternatives
- boundary impact
- test plan
- ADR need: yes or no

If an architecture rule must be violated, stop and create an ADR first.
