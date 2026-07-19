---
name: axatalk-sdk-implementation
description: Implements one approved Axatalk browser SDK work unit with strict protocol, security, compatibility, testing, and handoff gates. Use for SDK-00 through SDK-10 work in the standalone SDK project.
disable-model-invocation: true
---

# Axatalk SDK Implementation

## Read First

1. `AGENTS.md`
2. `docs/ARCHITECTURE.md`
3. `docs/SECURITY.md`
4. `docs/PROTOCOL.md`
5. `docs/IMPLEMENTATION-PLAN.md`
6. `docs/WORK-UNITS.md`
7. `docs/DEFINITION-OF-DONE.md`
8. `docs/CONSUMER-SMOKE-CHECKLIST.md`

## Intake

1. Select the first pending SDK work unit whose prerequisites are done.
2. If the user named a later unit, verify prerequisites and stop if any are open.
3. Restate scope, expected files, tests, security impact, and non-goals.
4. Execute one work unit only.

## Implementation Rules

- Keep `protocol` independent from `sdk`.
- Keep both independent from Axatalk Desktop internals.
- Validate `unknown` at every external boundary.
- Preserve side-effect-free constructors and explicit lifecycle states.
- Never add raw SIP/OCP credentials to normal SDK flows.
- Never replay mutations automatically.
- Update fixtures and API reports with every public contract change.
- Stop for an ADR when protocol semantics or trust policy are unclear.

## Verification

Run the focused work-unit tests, then the project preflight. Fix introduced failures before
handoff. Record exact commands and results in the work-unit evidence.

## Handoff

Update only the selected work-unit status and evidence. Summarize:

- public API changes;
- protocol compatibility impact;
- security behavior;
- tests and package checks;
- desktop integration dependency;
- remaining risks.

Request an independent `/sdk-review`. Do not start the next work unit.
