# OmniCall Kit Definition of Done

The SDK is not done because packages build or methods exist. All gates below are mandatory.

## Architecture

- [ ] SDK and protocol packages contain no desktop, Electron, SIP, OCP wire, React, or Zustand imports.
- [ ] Desktop commands map to existing Application Facades, Use Cases, or queries.
- [ ] Public events are mapped DTOs, not internal Domain Events.
- [ ] Constructor, transport, account, and logout responsibilities remain separate.
- [ ] No legacy browser global or DOM event bus exists.

## Type and Contract Quality

- [ ] Strict TypeScript passes with no forbidden casts or suppressions.
- [ ] Runtime schemas validate every inbound and outbound message.
- [ ] Public API report is reviewed and stable.
- [ ] Golden fixtures pass in SDK and desktop.
- [ ] Error codes, capabilities, events, and commands are documented.
- [ ] Protocol and package versions follow their separate policies.

## Security and Privacy

- [ ] Exact Origin, pairing, authentication, capability, replay, and revoke tests pass.
- [ ] No normal SDK API accepts raw SIP password or OCP API key.
- [ ] No secrets or unauthorized PII appear in events, logs, examples, fixtures, or snapshots.
- [ ] Resource limits and slow-consumer behavior are enforced.
- [ ] Multi-tab races and destructive command ownership are tested.
- [ ] Independent security review reports no Blockers.

## Reliability

- [ ] Reconnect is bounded, cancellable, jittered, and leak-free.
- [ ] Reconnect obtains a fresh snapshot and does not replay mutations.
- [ ] Sequence gaps and stale revisions recover predictably.
- [ ] Desktop restart, port conflict, and incompatible-version behavior are explicit.
- [ ] SDK disconnect or crash never terminates a desktop call or account session.

## Functional Coverage

- [ ] Read-only lifecycle and snapshot.
- [ ] Call event lifecycle.
- [ ] Call controls approved for v1.
- [ ] SIP registration state.
- [ ] SIP-only mode without OCP.
- [ ] Optional operator state and status changes.
- [ ] Logout reason workflow.
- [x] Window show; hide under ADR-0013 amendment (privileged + busy deny + tray recovery).

## Testing

- [x] Unit, schema, type, API, package, and integration tests pass.
- [x] Old/new SDK-desktop compatibility covered by unit/integration + historical DI close.
- [x] Desktop/kit preflight pass (no packaged/browser smoke required).
- [x] Negative security suite passes.
- [x] Test fixtures do not depend on real SIP or OCP for gate close.

## Developer Experience

- [ ] Installation, quick start, API, events, errors, capabilities, and security are documented.
- [ ] Examples compile and run in CI.
- [ ] Browser support and limitations are explicit.
- [ ] Upgrade, deprecation, rollback, revoke, and support policies exist.

## Release

- [x] Desktop F-011 / P12 gate is closed. *(DI-10 full close 2026-07-27)*
- [x] Release candidate was validated before stable promotion. *(RC `0.1.0-rc.0` → Mode B `0.1.0`)*
- [x] Changelog, SBOM, npm package contents verified for Mode B cut. *(provenance optional on local CLI)*
- [x] No known Blocker or High security issue deferred into stable `0.1.0`.
