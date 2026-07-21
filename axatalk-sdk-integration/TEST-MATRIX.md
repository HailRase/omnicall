# Desktop SDK Integration Test Matrix

## Per-Work-Unit Verification

Every work unit runs focused tests plus checks proportional to its risk. The final gate runs
the complete repository preflight and packaged integration matrix.

## Contract Tests

- valid command, reply, event, snapshot, and handshake fixtures;
- malformed, unknown, oversized, and deeply nested input;
- SDK and desktop fixture parity;
- additive compatibility and explicit breaking-version rejection;
- stable public error codes;
- no Domain, JsSIP, OCP wire, or UI object in public payloads.

## Broker Tests

- main request reaches exactly one renderer Application composition;
- response, typed failure, timeout, cancellation, and renderer unavailable;
- renderer reload rejects pending work and forces resync;
- app shutdown stops acceptance before cleanup;
- malformed WS and malformed IPC payloads fail independently;
- no pending request, listener, timer, or port leaks.

## Gateway Security Tests

- peer is loopback;
- hostile, missing, `null`, wildcard-like, and suffix-confusion Origins;
- unauthenticated snapshot/event/command access;
- pairing approval, denial, expiry, and revoke;
- replayed challenge, session, and request ID;
- capability escalation and per-command enforcement;
- frame/depth/connection/rate/queue limits;
- slow consumer and heartbeat timeout;
- occupied port and second application instance;
- logs contain no payload, token, secret, or unauthorized PII.

## DI-11 — Origin TOFU / Blacklist / Activate Consent (ADR-0018)

- first-contact `unknown` → renderer modal; Allow → `allowed` + base matrix; Deny →
  `forbidden`+`origin_denied` + close + blacklist;
- blacklisted Origin → upgrade reject; client maps `origin_blocked` (non-retryable);
- Unblock prior-`allowed` restores `allowed`+matrix; first-Deny-only → `unknown`;
- cannot edit allow/policy while denied; matrix retained but ignored while denied;
- discovery CORS ACAO for `unknown`+`allowed` only; never for `denied`;
- always-on gateway; Settings listener enable toggle absent; env kill-switch only;
- pre-auth Settings → Axatalk SDK reachable; OCP Module still gated (ADR-AF-004);
- activate: matrix off → `permission_denied` without modal; matrix on → modal every login;
- activate Deny → activate-disabled; pending duplicate → conflict; dismiss clears pending;
- no passwords / apiKeys on wire; `window.hide` still unavailable;
- SIP-only regression green with OCP disabled.

## Read-Only State Tests

- initial snapshot after authentication;
- redaction by capability;
- event ordering and monotonic sequence;
- sequence gap forces snapshot resync;
- desktop restart changes server instance/session epoch;
- registration and call state are aggregated rather than raw retry churn;
- OCP-disabled snapshot contains no fake OCP state;
- unsupported event does not break old client.

## Call Command Tests

For originate, answer, reject, hang up, hold, resume, mute, unmute, and DTMF:

- valid state maps to the existing Use Case/Call Engine;
- invalid state returns stable failure;
- missing capability is forbidden;
- stale revision and wrong owner are rejected;
- duplicate request is idempotent or rejected as specified;
- two clients issue conflicting commands;
- client disconnect during execution;
- timeout does not trigger automatic mutation replay;
- command correlation appears in safe logs/events.

## Account and OCP Tests

- SIP-only activation with OCP absent;
- active-session login requires logout first;
- OCP status change uses `callType: "sdk"`;
- prepare logout returns reasons or direct SIP-only path;
- confirm, cancel, missing reason, invalid reason, and failure;
- intentional logout disarms recovery and resets OCP projections;
- connected-only OCP disconnect plus SIP teardown;
- saved-profile activation keeps secrets desktop-only;
- external OCP endpoint cannot be used for SSRF.

## Window Tests

- show restores minimized window;
- focus behavior follows local policy and rate limit;
- unavailable/destroyed window returns typed failure;
- hide is unavailable until tray/background policy is implemented;
- hide is denied during incoming/active call unless explicitly allowed;
- window state events reflect real main-process state.

## Regression Suite

- SIP authorization and registration;
- SIP registration failure and recovery;
- incoming and outgoing calls;
- answer, reject, hang up, hold, resume, mute, unmute, DTMF;
- multi-call policy;
- account logout and shutdown cleanup;
- OCP authentication, status, reconnect, logout reasons, and SIP cascade;
- media/video, headset, settings, history, and notifications remain unaffected by gateway disablement;
- SDK server startup failure does not block core softphone.

## Compatibility Matrix

Run at least:

- current SDK ↔ current desktop;
- previous supported SDK ↔ current desktop;
- current SDK ↔ previous supported desktop;
- incompatible protocol client ↔ current desktop;
- desktop restart during SDK session;
- desktop update during idle and active call;
- SDK reconnect during idle and active call.

## Packaged End-to-End Gate

Required before public release:

1. Install a packaged Axatalk build (gateway always-on per ADR-0018; no Settings listener toggle).
2. Approve a test Origin via first-contact TOFU (or Settings) and complete pairing.
3. Connect from each supported browser.
4. Verify authenticated snapshot and redaction.
5. Exercise approved call and operator workflows against controlled infrastructure.
6. Revoke the client and prove immediate loss of access.
7. Restart/update desktop and prove safe resynchronization.
8. Prove blacklist / Unblock / activate consent paths (DI-11) or record waiver.
8. Capture versions, platform, results, and sanitized logs.

## Verification Commands

During implementation use focused commands first. Before DI-10:

```text
npm run release:preflight
npm run i18n:check
npm run ui:catalog:check
```

DI-10 canonical verification names (2026-07-21):

```text
npm run release:preflight
npm run i18n:check
npm run ui:catalog:check
npx vitest run src/adapters/integration/LocalWsServerAdapter.compat.test.ts
node axatalk-sdk-integration/scripts/di10-packaged-smoke.mjs
node axatalk-sdk-integration/scripts/di10-browser-smoke.mjs
# from axatalk-sdk/:
npm run api:check
npm run preflight
```

Evidence: `evidence/DI-10-compatibility-e2e-p12-close.md`.
