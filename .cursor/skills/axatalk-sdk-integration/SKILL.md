---
name: axatalk-sdk-integration
description: Implements one F-011/P12 Axatalk Desktop SDK integration work unit across Electron main, typed IPC, Application routing, security, events, settings, and compatibility tests. Use for DI-00 through DI-10.
disable-model-invocation: true
---

# Axatalk Desktop SDK Integration

## Read First

1. `AGENTS.md`
2. `docs/softphone/STATUS.md`
3. `docs/softphone/Architecture-Constitution.md`
4. `docs/softphone/Feature-Registry.md` — F-011
5. `docs/softphone/Implementation-Roadmap.md` — P12
6. `axatalk-sdk-integration/AGENTS.md`
7. `axatalk-sdk-integration/00-SNAPSHOT.md`
8. `axatalk-sdk-integration/IMPLEMENTATION-PLAN.md`
9. `axatalk-sdk-integration/WORK-UNITS.md`
10. `axatalk-sdk-integration/TEST-MATRIX.md`
11. `axatalk-sdk-integration/SMOKE-CHECKLIST.md`
12. `axatalk-sdk/docs/PROTOCOL.md`
13. `axatalk-sdk/docs/SECURITY.md`

## Intake

1. Select one DI work unit with closed prerequisites.
2. Confirm Feature/LF IDs, bounded contexts, layers, and regression risks.
3. Restate expected files, tests, security impact, and non-goals.
4. Stop for missing ADR or conflicting SDK protocol decisions.

## Non-Negotiable Boundaries

- WebSocket server and native window actions live in main.
- Existing Facades, Call Engine, SIP/OCP sessions, and product projections remain in the
  single renderer Application composition.
- Main-to-renderer product traffic uses one typed validated broker.
- No second Facade/composition in main.
- No product command bypasses Application Use Cases or Call Engine.
- OCP remains optional; SIP-only regressions are Blockers.
- No raw credentials, internal Domain Events, OCP wire objects, or JsSIP objects cross the API.
- No browser globals or DOM event bus.

## Verification and Handoff

Run focused tests and proportional preflight from the work unit and test matrix. Update
Registry, Legacy Coverage, handoff, STATUS, and work-history only when facts changed.

Record exact evidence, request `/sdk-review`, and stop. Do not execute the next DI unit.
