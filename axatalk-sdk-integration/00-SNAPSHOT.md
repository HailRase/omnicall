# Desktop SDK Integration Baseline Snapshot

## Snapshot Purpose

This file freezes the pre-P12 architecture and scope. DI-00 refreshed automated counts and
recorded evidence on 2026-07-20.

## Product Baseline

- Axatalk Desktop version: `0.11.2`
- Branch / commits (DI-00): `feature/axatalk-sdk` — code preflight `5114c02`; docs `18fb3f1`
- F-011 Host Integration Contract: `in progress` (DI-01 contracts `done`; no product gateway)
- P12 External Host API Compatibility: architecture closed (DI-00); DI-01 contracts `done` (`/sdk-review` PASS)
- F-028 OCP command subset E-12: implemented
- SIP-only product path: implemented and mandatory
- OCP module: optional
- Legacy `window.Softphone`: intentionally not ported

## DI-00 Architecture Gate

| ADR | Topic |
| --- | --- |
| ADR-0009 | Process ownership + typed broker lifecycle |
| ADR-0010 | Local transport, discovery, browser support |
| ADR-0011 | Pairing, Origin, capabilities, replay, revocation |
| ADR-0012 | Protocol versioning, privacy, call ownership |
| ADR-0013 | Window policy + SDK sign-in vs ADR-AF-003 |

Evidence: `axatalk-sdk-integration/evidence/DI-00-baseline.md`  
Handoff: `docs/softphone/handoffs/P12-External-Host-API-Master-Handoff.md`

## Current Process Ownership

- Electron main owns application/window lifecycle, native IPC handlers, secure storage,
  permissions, and native shell operations.
- Renderer creates the single real/mock `AccountBootstrapFacade` composition.
- Call Engine, JsSIP, OCP composition, Domain Event bus, and product projections are owned
  by that renderer composition.
- Preload exposes a narrow typed `window.softphone` API with context isolation, sandbox,
  disabled Node integration, and web security enabled.
- Future SDK path (ADR-0009): main WS gateway → typed broker → renderer
  `ExternalCommandRouter` → existing Facades / Use Cases / Call Engine.

## Existing Reusable Assets

- `src/shared/host-api/OcpHostApiContract.ts`
- `AccountBootstrapFacade.authenticateOcpFromHost`
- `AccountBootstrapFacade.changeOcpStatusFromHost`
- `AccountBootstrapFacade.logoutOcpFromHost`
- `AccountBootstrapFacade.disconnectOcpFromHost`
- `AccountBootstrapFacade.getOcpConnectionState`
- serializable OCP projections and subscription surface
- typed telephony and registration Domain Events
- `DomainEventPublisher`
- `SecretStoragePort`
- Electron shell window controller and existing minimize/layout IPC

## Missing Components

- real `LocalWsServerAdapter` / listening gateway (port + mock exist from DI-01);
- typed main-to-renderer command broker **implementation** (port + mock exist from DI-01);
- `ExternalCommandRouter`;
- public snapshot/event mapper;
- pairing, Origin, capability, replay, revoke, and resource policies (implementation);
- SDK settings and operational UX;
- public call command mapping;
- window show/hide public implementation (`hide` policy-gated per ADR-0013);
- protocol integration and packaged E2E tests.

## Frozen Non-Goals

- no legacy global API;
- no DOM CustomEvent host bus;
- no raw SIP/OCP credentials in protocol v1;
- no second Facade or telephony composition in main;
- no transfer backlog implementation;
- no Contacts or History SDK API;
- no relocation of the complete telephony stack to main;
- no stable npm publication before P12 close.

## Baseline Verification (DI-00 captured)

| Item | Result |
| --- | --- |
| Branch / commits | `feature/axatalk-sdk` / code `5114c02` + docs `18fb3f1` |
| `npm run release:preflight` | PASS — 2297 passed / 1 skipped |
| `npm run i18n:check` | PASS |
| `npm run ui:catalog:check` | FAIL — pre-existing catalog drift (recorded) |
| Manual SIP/OCP/call smoke | Checklist frozen; execution deferred to owning DI units / DI-10 |
| Evidence path | `axatalk-sdk-integration/evidence/DI-00-baseline.md` |

## Baseline Rule

Any regression relative to this snapshot is a Blocker unless an accepted ADR explicitly
changes the product behavior and all affected Feature/LF records are updated.
