# Desktop SDK Integration Manual Smoke Checklist

Use this checklist for DI-10 and release candidates. Earlier work units may execute the
relevant subset, but no partial run closes P12.

## Record

- Date: **2026-07-21** (DI-10 partial packaged subset)
- Desktop version/commit: **0.11.2** / `9e9a61d` (+ DI-10 working tree)
- SDK version/commit: workspace **0.0.0** (API 47/169) / same repo
- Protocol version: **1**
- OS: Windows 10 (19045)
- Browser/version: Microsoft Edge **150.0.4078.83**
- Gateway configuration: env allowlist `http://127.0.0.1:8765`; `AXATALK_SDK_GATEWAY=1`; win-unpacked
- Test operator/profile: **not used** this run (pairing/call cells OPEN)
- Reviewer: re-request `/sdk-review` DI-10 (FAIL findings remediated 2026-07-21)

Sanitized reports: `evidence/DI-10-packaged-smoke-report.json`, `evidence/DI-10-browser-smoke-report.json`,
`evidence/DI-10-compatibility-e2e-p12-close.md`.

Do not record credentials, tokens, full phone numbers, or customer data.

## Setup

- [x] Packaged Axatalk build installed. *(win-unpacked `0.11.2`)*
- [ ] Controlled SIP/OCP test infrastructure available. *(OPEN)*
- [x] Test Origin approved through the desktop UX/policy. *(env allowlist for smoke Origin; Settings UX path OPEN)*
- [x] A separate hostile Origin is available.
- [x] Logs are enabled with secret/PII redaction. *(policy held; no secrets in reports)*
- [x] SDK client starts without cached state from a previous run. *(fresh Edge profile for browser smoke)*

## Transport and Pairing

- [ ] Desktop starts with SDK integration disabled and core SIP remains usable. *(OPEN live; automated disable/start-denial cited)*
- [x] Enabling integration starts one loopback listener. *(discovery :17341)*
- [ ] Second desktop instance does not own a competing listener. *(OPEN live; automated not-primary cited)*
- [x] Hostile, missing, and `null` Origins are rejected. *(packaged hostile + unit missing/null)*
- [x] Approved Origin receives pairing-required without product state.
- [ ] Pairing approval authenticates only the approved client and capabilities. *(OPEN — Settings UX)*
- [ ] Pairing denial, expiry, and revoke fail closed. *(OPEN live UI; automated revoke PASS)*
- [x] Replayed handshake/request is rejected. *(automated PoP/challenge)*

## Read-Only State

- [ ] Initial snapshot matches desktop account/registration/call/window state.
- [ ] Unauthorized PII is redacted.
- [ ] Incoming, outgoing, ringing, answered, held/resumed, muted/unmuted, ended, and failed
  call events match desktop behavior.
- [ ] Event sequence gap triggers a fresh snapshot.
- [ ] Desktop restart changes server instance/session epoch and SDK resynchronizes.
- [ ] SDK disconnect leaves account and active calls unchanged.

## Window

- [ ] `window:show` restores a minimized window.
- [ ] Focus behavior follows rate and local policy.
- [ ] Destroyed/unavailable window returns a typed error.
- [ ] `window:hide` is unavailable unless its policy and tray recovery are implemented.
- [ ] Active/incoming call policy prevents unsafe hiding.

## Call Commands

- [ ] Originate.
- [ ] Answer and reject.
- [ ] Hang up.
- [ ] Hold and resume.
- [ ] Mute and unmute.
- [ ] Send DTMF.
- [ ] Missing capability is forbidden.
- [ ] Two tabs issuing conflicting commands receive deterministic ownership/conflict results.
- [ ] SDK reconnect does not repeat the previous mutation.

## SIP-Only Regression

- [ ] SIP-only sign-in and registration work with OCP disabled.
- [ ] Registration failure and recovery remain visible and recoverable.
- [ ] SDK gateway startup failure does not block SIP.
- [ ] Logout works without OCP and terminates no unrelated state.
- [ ] App restart/close cleanup remains correct.

## OCP and Logout

- [ ] OCP remains optional.
- [ ] Operator state/reasons contain no OCP wire objects.
- [ ] Status change is audited as SDK-originated.
- [ ] Prepare logout requests a reason when required.
- [ ] Confirm and cancel logout behave like the canonical account workflow.
- [ ] Intentional logout does not trigger OCP reconnect.
- [ ] Connected-only and missing-operator-snapshot paths remain deterministic.

## Abuse and Privacy

- [ ] Oversized/deep messages are rejected.
- [ ] Connection/rate/queue limits work.
- [ ] Slow consumer is disconnected without affecting desktop.
- [ ] Revoked client stops receiving events immediately.
- [ ] Logs contain no payloads, secrets, tokens, or unauthorized PII.
- [ ] OCP endpoint input cannot trigger SSRF.

## Compatibility

- [ ] Current SDK ↔ current desktop.
- [ ] Previous supported SDK ↔ current desktop.
- [ ] Current SDK ↔ previous supported desktop.
- [ ] Unsupported protocol receives `incompatible_version` before state disclosure.
- [ ] Desktop update/restart during an active call preserves the call and safely resynchronizes.

## Result

- Overall: **PARTIAL** (not PASS — remaining OPEN cells forbid P12 / F-011 close)
- Failed item IDs: none claimed FAIL; OPEN cells listed above + call/OCP/compat prior-release rows
- Sanitized evidence paths: `evidence/DI-10-compatibility-e2e-p12-close.md`
- Follow-up work unit: complete OPEN smoke cells after `/sdk-review` DI-10 (or human-named waivers)

P12 may close only with PASS and independent architecture, work-unit, and security reviews.
