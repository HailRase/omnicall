# Desktop SDK Integration Baseline Snapshot

## Snapshot Purpose

This file freezes the pre-P12 architecture and scope. DI-00 must refresh test counts and
runtime evidence before production implementation begins.

## Product Baseline

- Axatalk Desktop version: `0.11.2`
- F-011 Host Integration Contract: `planned`
- P12 External Host API Compatibility: not started
- F-028 OCP command subset E-12: implemented
- SIP-only product path: implemented and mandatory
- OCP module: optional
- Legacy `window.Softphone`: intentionally not ported

## Current Process Ownership

- Electron main owns application/window lifecycle, native IPC handlers, secure storage,
  permissions, and native shell operations.
- Renderer creates the single real/mock `AccountBootstrapFacade` composition.
- Call Engine, JsSIP, OCP composition, Domain Event bus, and product projections are owned
  by that renderer composition.
- Preload exposes a narrow typed `window.softphone` API with context isolation, sandbox,
  disabled Node integration, and web security enabled.

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

- public protocol package and compatibility fixtures;
- `ExternalClientGateway`;
- `LocalWsServerAdapter`;
- typed main-to-renderer command broker;
- `ExternalCommandRouter`;
- public snapshot/event mapper;
- pairing, Origin, capability, replay, revoke, and resource policies;
- SDK settings and operational UX;
- public call command mapping;
- window show/hide public policy;
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

## Baseline Verification to Capture in DI-00

- current branch and commit;
- `npm run release:preflight`;
- `npm run i18n:check`;
- `npm run ui:catalog:check`;
- current automated test counts;
- SIP-only authorization/register/logout smoke;
- incoming/outgoing/answer/hangup smoke;
- OCP authenticate/status/logout-reason smoke where staging is available;
- app close/restart cleanup;
- redacted baseline logs.

## Baseline Rule

Any regression relative to this snapshot is a Blocker unless an accepted ADR explicitly
changes the product behavior and all affected Feature/LF records are updated.
