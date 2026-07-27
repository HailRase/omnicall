# DI-01 — Protocol contracts, ports, and mocks

**Date:** 2026-07-20 13:05 (local)  
**Branch:** `feature/axatalk-sdk`  
**Desktop version:** `0.11.2`  
**Work unit:** DI-01 — Protocol Contracts, Ports, and Mocks  
**Status:** `done` — `/sdk-review` **PASS** (2026-07-20)

## Prerequisites verified

| Prerequisite | Status |
| --- | --- |
| DI-00 `done` (`/sdk-review` PASS) | yes |
| SDK-01 `done` | yes |
| SDK-02 `@axata/axatalk-protocol` + fixtures `done` | yes |
| DI-01 was `pending` before this session | yes |

## Intake (recorded before coding)

- Feature/LF: F-011; LF-051, LF-065, LF-080, LF-081
- Bounded context: Integration (primary)
- Layers changed: Ports + mock adapters + tests; desktop `package.json` file dep; eslint ignore for nested SDK workspace
- Layers not changed for business logic: Domain, React UI, Zustand, Call Engine, JsSIP, OCP wire, preload, main product path
- Regression risks refused: SIP-only auth; optional OCP; call/media/headset; single Application composition; Domain free of protocol/Zod/Electron; sandbox/preload; no `window.Softphone`; transfer backlog; no secret/PII in new logs/DTOs

## Delivered

### Protocol consume (byte-identical)

- Root dependency: `"@axata/axatalk-protocol": "file:axatalk-sdk/packages/protocol"`
- Fixtures loaded from `axatalk-sdk/packages/protocol/fixtures/**` (same tree as SDK-02)
- Desktop tests accept every `valid/**` and reject every `invalid/**` with sibling `meta/**/*.meta.json` `expectedErrorCode`
- No parallel Zod/schema stack; Domain has zero protocol imports (test + eslint restriction)

### Ports (interfaces only)

- `src/ports/integration/ExternalClientGateway.ts`
- `src/ports/integration/MainToRendererBrokerPort.ts`
- `src/ports/integration/ExternalCommandHandler.ts` (+ `ExternalQueryHandler`)
- Re-exported from `src/ports/index.ts`

### Mocks (deterministic; no sockets/IPC/Electron)

- `src/adapters/mock/MockExternalClientGateway.ts`
- `src/adapters/mock/MockMainToRendererBroker.ts`
- `src/adapters/mock/MockExternalCommandHandler.ts` (command + query doubles)
- Fail closed via `validateWireMessage` / `validateDiscoveryDocument`; no Zod internals leaked

### Explicit non-goals (confirmed absent)

- No loopback HTTP/WS server, no IPC broker implementation, no preload channels
- No pairing/PoP/IndexedDB, no snapshot mappers to live Domain Events
- No composition-root wiring of mocks into product bootstrap (inert additive surface)
- F-011 **not** marked `implemented` (status `in progress` only)

## Verification

| Command | Result |
| --- | --- |
| Focused DI-01 vitest (5 files / 24 tests) | **PASS** |
| `npm run test` | **PASS** — **2321 passed / 1 skipped** (DI-00 baseline was 2297 / 1; +24 = DI-01) |
| `npm run lint` | **PASS** |
| `npm run typecheck` | **PASS** |
| `npx tsc --noEmit -p tsconfig.node.json` | **PASS** |

### Lint note

Root `eslint .` previously also walked nested `axatalk-sdk/**` (separate workspace with its own ESLint; includes in-progress SDK-03 WIP). DI-01 added `axatalk-sdk/**` to desktop root eslint `ignores` so desktop and SDK lint stay independent. SDK continues to lint via `cd axatalk-sdk && npm run lint`.

## Boundary proof

- `src/ports/integration/sdk-dependency-boundary.test.ts` — Domain free of `@axata/axatalk-protocol` / zod / electron / ws; renderer components/stores free of gateway ports
- `eslint.config.js` — Domain `no-restricted-imports` for the same packages

## Security / privacy

- No new network listeners
- No credentials/`apiKey`/`ocpAuthToken`/SIP passwords on new surfaces
- Mock failures return only `{ success\|ok, code }` (stable protocol codes)
- Fixtures remain synthetic (SDK-02 corpus)

## Registry / STATUS

- F-011 → `in progress` (contracts started; not implemented)
- STATUS / P12 handoff updated for DI-01 `review`
- Version **not** bumped (contracts/ports only; no user-visible feature ship)

## Remaining risks

- DI-02 must implement real IPC broker without second Application composition
- Schema tightness discoveries when wiring live mappers (DI-05+) must go through ADR/fixtures, not a second schema stack
- `window:hide` schema-valid; **DI-01 gate day** product-denied until tray policy
  (**superseded 2026-07-27** — product-available under ADR-0013 amendment)
- Manual SIP/OCP/call smoke still deferred (SMOKE-CHECKLIST; DI-10)

## Handoff checklist (Execution Template)

- Work unit: DI-01
- Prerequisites verified: DI-00 done; SDK-01 done; SDK-02 done
- Feature/LF IDs: F-011; LF-051, LF-065, LF-080, LF-081
- Bounded contexts: Integration
- Layers changed: Ports, mock adapters, tests, package.json dep, eslint ignores/restrictions, registry/STATUS/handoff docs
- Files added/changed: see evidence paths above + `package-lock.json`
- Commands/events added: none (ports/interfaces only; no Domain Events)
- Security impact: fail-closed validation at mock boundary; no transport; Domain import ban strengthened
- Regression risks: additive/inert — no SIP/OCP/call composition wiring; suite green (+24 tests)
- Automated tests: fixture consume, dependency-boundary, mock gateway/broker/handlers
- Manual evidence: not claimed (smoke deferred)
- Verification commands: listed above
- Registry/Legacy/STATUS changes: F-011 `in progress`; STATUS + P12 handoff factual DI-01 progress
- Remaining risks: see above
- Reviewer: `/sdk-review` **PASS** (2026-07-20) — independent re-run: focused 24 PASS; full suite 2321/1; lint/typecheck/registry green.
- Low nits remediated same day: mock maps validated commands to `BrokerProductRequest`; fixed mock `occurredAt`; store-boundary asserts `targets.length > 0`.
