# P12 External Host API and Axatalk SDK — Master Handoff

## Status

- Feature: F-011
- Legacy coverage: LF-051, LF-065, LF-080, LF-081
- Phase: P12
- State: planned; implementation not started
- Branch: `feature/axatalk-sdk`
- First gate: DI-00 architecture baseline

## Mission

Replace the rejected legacy `window.Softphone` embed API with a secure, versioned browser
SDK and Electron-native local gateway while preserving every existing softphone behavior.

## Execution Packages

- SDK project: `axatalk-sdk/README.md`
- SDK work units: `axatalk-sdk/docs/WORK-UNITS.md`
- Desktop integration: `axatalk-sdk-integration/README.md`
- Desktop work units: `axatalk-sdk-integration/WORK-UNITS.md`
- Test matrix: `axatalk-sdk-integration/TEST-MATRIX.md`
- Manual smoke: `axatalk-sdk-integration/SMOKE-CHECKLIST.md`

## Mandatory Order

1. DI-00 — ADRs, baseline, and process/security decisions.
2. SDK-00 — standalone package workspace and CI.
3. SDK-01 — protocol/security ADR closure with DI-00.
4. DI-01 + SDK-02 — shared protocol contracts and fixtures.
5. DI-02 — typed main-to-renderer broker.
6. DI-03/04 + SDK-03/04 — transport, pairing, and capabilities.
7. DI-05 + SDK-05 — read-only beta.
8. DI-06 + SDK-06 — call controls.
9. DI-07 + SDK-07 — operator/logout.
10. DI-08 + SDK-08 — privileged saved-profile activation.
11. DI-09 + SDK-09 — settings and developer experience.
12. DI-10 + SDK-10 — compatibility, security, packaged E2E, and release.

Independent `/sdk-review` is required after every work unit.

## Architecture Gate

- [ ] WebSocket server and native window actions are owned by Electron main.
- [ ] Existing Facades, Call Engine, SIP/OCP sessions, and projections remain in the single
  renderer Application composition.
- [ ] One typed validated broker connects main to that composition.
- [ ] No second Facade or telephony composition exists in main.
- [ ] Product commands terminate in focused Application handlers / Facades / Use Cases.
- [ ] Call commands always pass through Call Engine.
- [ ] OCP remains optional and SIP-only remains fully functional.
- [ ] Public DTOs do not expose internal Domain Events, JsSIP, OCP wire, React, or stores.

## Security Gate

- [ ] Loopback-only endpoint and single-instance ownership.
- [ ] Exact Origin gate before data exchange.
- [ ] Per-client pairing, capabilities, expiry, and revocation.
- [ ] Replay/idempotency and aggregate command serialization.
- [ ] Resource limits, heartbeat, backpressure, and safe teardown.
- [ ] Per-client redacted events; no indiscriminate broadcast.
- [ ] No raw SIP/OCP credentials in protocol v1.
- [ ] Independent security review has no Blocker.

## Regression Gate

- [ ] SIP-only sign-in/register/recovery/logout.
- [ ] Incoming/outgoing/answer/reject/hangup/hold/resume/mute/DTMF.
- [ ] Multi-call behavior.
- [ ] OCP auth/status/recovery/logout reasons/SIP cascade.
- [ ] Settings, media/video, headset, history, notifications, restart, and shutdown.
- [ ] SDK server disabled or failed does not block core softphone.
- [ ] SDK disconnect/revoke never terminates calls or account sessions.

## Documentation Gate

- [ ] F-011 acceptance and evidence are accurate.
- [ ] LF-051/065/080/081 evidence is accurate.
- [ ] STATUS and P12 roadmap reflect real progress.
- [ ] Protocol, API, events, errors, capabilities, security, browser support, and upgrade
  policy are documented.
- [ ] Work-history and per-WU evidence exist.
- [ ] No false completed checkbox or premature `implemented` status.

## Completion

P12 closes only when:

- DI-00…DI-10 and SDK-00…SDK-10 are independently reviewed;
- the complete automated and manual matrices pass;
- packaged Electron interoperates with the release-candidate SDK;
- compatibility and rollback are verified;
- F-011 is moved to `implemented` with real evidence;
- no Blocker remains.

## Next Agent Prompt

Run `/sdk-integration` and execute DI-00 only. Do not install dependencies or write
production code in DI-00. Then run `/sdk-review`.
