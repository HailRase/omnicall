# Desktop SDK Integration Manual Smoke Checklist

Use this checklist for DI-10 and release candidates. Earlier work units may execute the
relevant subset, but no partial run closes P12.

## Record

- Date:
- Desktop version/commit:
- SDK version/commit:
- Protocol version:
- OS:
- Browser/version:
- Gateway configuration:
- Test operator/profile:
- Reviewer:

Do not record credentials, tokens, full phone numbers, or customer data.

## Setup

- [ ] Packaged Axatalk build installed.
- [ ] Controlled SIP/OCP test infrastructure available.
- [ ] Test Origin approved through the desktop UX/policy.
- [ ] A separate hostile Origin is available.
- [ ] Logs are enabled with secret/PII redaction.
- [ ] SDK client starts without cached state from a previous run.

## Transport and Pairing

- [ ] Desktop starts with SDK integration disabled and core SIP remains usable.
- [ ] Enabling integration starts one loopback listener.
- [ ] Second desktop instance does not own a competing listener.
- [ ] Hostile, missing, and `null` Origins are rejected.
- [ ] Approved Origin receives pairing-required without product state.
- [ ] Pairing approval authenticates only the approved client and capabilities.
- [ ] Pairing denial, expiry, and revoke fail closed.
- [ ] Replayed handshake/request is rejected.

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

- Overall: PASS / FAIL
- Failed item IDs:
- Sanitized evidence paths:
- Follow-up work unit:

P12 may close only with PASS and independent architecture, work-unit, and security reviews.
