# ADR-0001: Real Adapter Integration Strategy

## Status

Accepted

## Context

The platform implements F-000 through F-015 on mock gateways (488+ tests). Production requires JsSIP, browser WebRTC media, and OCP WebSocket without breaking Domain, Application, CI, or mock-based development.

## Decision

1. **Parallel track (RAT)** on branch `feature/real-adapters` with documentation in `docs/softphone/real-integration/`.
2. **Mock remains default** for `npm run test` and CI. Real adapters activate via `?adapters=real` or `VITE_ADAPTER_MODE=real`.
3. **Vertical slices** R1–R7 (registration → media → calls → controls → OCP → transfer deferred).
4. **Composition factory** `createSoftphoneComposition({ mode })` selects adapters; Use Cases and Domain unchanged.
5. **No JsSIP/WebSocket/DOM types** cross port boundaries.
6. **AccountBootstrapFacade** is not extended for adapter logic; only bootstrap wiring changes.
7. **Secrets** in `.env.local` (gitignored); never logged.
8. Port contract changes require ADR before implementation.
9. **SIP library:** use npm package `@hailrase/jssip` (fork of versatica/JsSIP with a micro-fix). See `docs/softphone/real-integration/JSSIP-FORK.md`. Do not depend on upstream `jssip` without ADR.
10. **OCP plugin:** product-deferred per [ADR-0002](./ADR-0002-defer-ocp-plugin.md); see `../OCP-PLUGIN-BACKLOG.md`. RAT R5 / step 06 smoke not an active gate.

## Consequences

- Positive: mock CI stays fast; real integration is incremental and resumable via PROGRESS.md.
- Negative: dual bootstrap paths until real mode is production-default.
- Deferred: moving composition root to Electron main process until R5+ stabilizes.

## Alternatives considered

- Big-bang JsSIP adapter for all TelephonyGateway methods — rejected (high regression risk).
- Skip mock after real exists — rejected (breaks unit/integration test speed).
