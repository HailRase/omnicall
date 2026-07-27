# Axatalk SDK Consumer Smoke Checklist

Use this checklist for SDK-09 examples and every release candidate.

## Record

- Date:
- SDK version:
- Protocol version:
- Desktop version:
- Browser/version:
- Example application commit:
- Reviewer:

## Package

- [ ] Clean consumer project installs the packed SDK tarball.
- [ ] ESM import resolves without bundler aliases.
- [ ] Type declarations and package exports resolve correctly.
- [ ] Browser bundle contains no Node or Electron dependency.
- [ ] Package contents, source maps, license, and README are correct.

## Lifecycle

- [ ] Constructing `AxatalkClient` causes no connection or authentication.
- [ ] Connect reports each explicit state.
- [ ] Pairing-required is distinguishable from authentication failure.
- [ ] Disconnect removes listeners, timers, pending requests, and reconnect attempts.
- [ ] Incompatible and revoked states are typed and documented.

## State and Events

- [ ] Authenticated connect receives one fresh snapshot.
- [ ] Typed event subscriptions and unsubscribe work.
- [ ] Snapshot revision and event sequence remain consistent.
- [ ] Event gap causes resynchronization.
- [ ] Reconnect replaces stale state and does not duplicate subscriptions.
- [ ] Unauthorized fields remain absent/redacted.

## Commands

- [ ] Allowed command returns a typed success.
- [ ] Missing capability returns `forbidden`.
- [ ] Invalid input is rejected before or at the protocol boundary.
- [ ] Timeout and cancellation are distinguishable.
- [ ] Conflict, stale state, not owner, and interaction required are documented.
- [ ] Mutation is not replayed after reconnect.
- [ ] `window.show` / `window.getState` work with `window.show` grant.
- [ ] `window.hide({ expectedRevision })` succeeds when Origin matrix grants `window.hide`
      and telephony is idle; without grant → `forbidden`; busy call → `conflict`.
- [ ] After hide, tray Show or `window.show` restores visibility.

## Security

- [ ] Example contains no SIP password, OCP API key, pairing secret, or token.
- [ ] Example does not use localStorage/sessionStorage for authorization material.
- [ ] Diagnostics contain no payloads or phone numbers.
- [ ] Hostile Origin and revoked client cannot obtain state.

## Documentation

- [ ] Quick start compiles as written.
- [ ] Capability and error references match the public API report.
- [ ] Browser support and localhost limitations are explicit.
- [ ] Multi-tab and logout workflows are explained.
- [ ] Upgrade and deprecation guidance matches the release.

## Result

- Overall: PASS / FAIL
- Failed item IDs:
- Sanitized evidence:
- Follow-up work unit:
