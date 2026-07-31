# Desktop SDK Integration Manual Smoke Checklist

Use this checklist for DI-10 and release candidates. Earlier work units may execute the
relevant subset, but no partial run closes P12.

## Record

- Date: **2026-07-21** (DI-10 packaged subset) / **2026-07-27** (DI-10 **full close**)
- Desktop version/commit: **0.11.2** / `9e9a61d` (+ DI-10 working tree)
- SDK version/commit: npm **`0.1.0-rc.0`** (2026-07-27) / workspace same repo
- Protocol version: **1**
- OS: Windows 10 (19045)
- Browser/version: Microsoft Edge **150.0.4078.83**
- Gateway configuration: env allowlist `http://127.0.0.1:8765`; `OMNICALL_SDK_GATEWAY=1`; win-unpacked
- Test operator/profile: gate-day subset + **full close** 2026-07-27
- Reviewer: `/sdk-review` **PASS** 2026-07-21; **full close** human 2026-07-27 (DI-10 complete; F-011/`implemented`; P12 closed)

Sanitized reports: `evidence/DI-10-packaged-smoke-report.json`, `evidence/DI-10-browser-smoke-report.json`,
`evidence/DI-10-compatibility-e2e-p12-close.md`.

Do not record credentials, tokens, full phone numbers, or customer data.

## Setup

- [x] Packaged OmniCall build installed. *(win-unpacked `0.11.2`)*
- [x] Controlled SIP/OCP test infrastructure available. *(full close 2026-07-27)*
- [x] Test Origin approved through the desktop UX/policy. *(env allowlist + Settings path closed 2026-07-27)*
- [x] A separate hostile Origin is available.
- [x] Logs are enabled with secret/PII redaction. *(policy held; no secrets in reports)*
- [x] SDK client starts without cached state from a previous run. *(fresh Edge profile for browser smoke)*

## Transport and Pairing

- [x] Desktop starts with SDK integration disabled and core SIP remains usable. *(full close 2026-07-27; automated disable/start-denial cited)*
- [x] Enabling integration starts one loopback listener. *(discovery :17341; always-on DI-11)*
- [x] Second desktop instance does not own a competing listener. *(full close 2026-07-27; automated not-primary cited)*
- [x] Hostile, missing, and `null` Origins are rejected. *(packaged hostile + unit missing/null)*
- [x] Approved Origin receives pairing-required without product state.
- [x] Pairing approval authenticates only the approved client and capabilities. *(full close 2026-07-27)*
- [x] Pairing denial, expiry, and revoke fail closed. *(full close 2026-07-27; automated revoke PASS)*
- [x] Replayed handshake/request is rejected. *(automated PoP/challenge)*

## Read-Only State

- [x] Initial snapshot matches desktop account/registration/call/window state. *(full close 2026-07-27; DI-05 automated)*
- [x] Unauthorized PII is redacted. *(full close 2026-07-27; DI-05)*
- [x] Incoming, outgoing, ringing, answered, held/resumed, muted/unmuted, ended, and failed
  call events match desktop behavior. *(full close 2026-07-27)*
- [x] Event sequence gap triggers a fresh snapshot. *(full close 2026-07-27)*
- [x] Desktop restart changes server instance/session epoch and SDK resynchronizes. *(full close 2026-07-27)*
- [x] SDK disconnect leaves account and active calls unchanged. *(unit + full close 2026-07-27)*

## Window

- [x] `window:show` restores a minimized window. *(full close 2026-07-27; DI-05)*
- [x] `window:show` brings OmniCall above other apps when visible but occluded (not only taskbar flash). *(full close 2026-07-27)*
- [x] Incoming call raises/restores OmniCall above other apps. *(full close 2026-07-27)*
- [x] Outgoing Connecting raises/restores OmniCall above other apps. *(full close 2026-07-27)*
- [x] SDK Origin trust (TOFU) pending raises OmniCall above other apps. *(DI-11 + full close 2026-07-27)*
- [x] SDK Origin TOFU / pairing pending raises OmniCall and shows root `SdkConnectCeremonyModal` (no Settings auto-open). *(DI-11)*
- [x] Waiting Cancel / Escape dismisses ceremony waiting without blacklisting Origin. *(DI-11)*
- [x] Disconnect mid-TOFU closes modal without blacklisting; disconnect mid-pairing clears pending Approve/Deny. *(DI-11)*
- [x] Removing/blacklisting an Origin while pairing is pending closes that socket and clears pending (paired clients remain until explicit revoke). *(DI-11)*
- [x] Focus behavior follows rate and local policy (ADR-0013 bring-to-front; no permanent always-on-top). *(full close 2026-07-27)*
- [x] Destroyed/unavailable window returns a typed error. *(full close 2026-07-27)*
- [x] `window:hide` succeeds when Origin matrix grants `window.hide`, telephony is idle, and
      `expectedRevision` matches (SDK `client.window.hide`). *(DI-05 follow-up 2026-07-27)*
- [x] Hide without matrix grant returns `forbidden` / `permission_denied`. *(DI-05 follow-up)*
- [x] Active/incoming/connecting call (telephony busy) returns `conflict` and does not hide. *(DI-05 follow-up)*
- [x] After successful hide, tray Show (or `window.show`) restores the window. *(DI-05 follow-up)*

## Call Commands

- [x] Originate. *(full close 2026-07-27; DI-06)*
- [x] Answer and reject. *(full close 2026-07-27)*
- [x] Hang up. *(full close 2026-07-27)*
- [x] Hold and resume. *(full close 2026-07-27)*
- [x] Mute and unmute. *(full close 2026-07-27)*
- [x] Send DTMF. *(full close 2026-07-27)*
- [x] Missing capability is forbidden. *(DI-06 automated)*
- [x] Two tabs issuing conflicting commands receive deterministic ownership/conflict results. *(ADR-0021 shared-desk + full close 2026-07-27)*
- [x] SDK reconnect does not repeat the previous mutation. *(full close 2026-07-27)*

## SIP-Only Regression

- [x] SIP-only sign-in and registration work with OCP disabled. *(full close 2026-07-27)*
- [x] Registration failure and recovery remain visible and recoverable. *(full close 2026-07-27)*
- [x] SDK gateway startup failure does not block SIP. *(automated + full close 2026-07-27)*
- [x] Logout works without OCP and terminates no unrelated state. *(full close 2026-07-27)*
- [x] App restart/close cleanup remains correct. *(full close 2026-07-27)*

## OCP and Logout

- [x] OCP remains optional. *(full close 2026-07-27)*
- [x] Operator state/reasons contain no OCP wire objects. *(DI-07)*
- [x] Status change is audited as SDK-originated. *(DI-07)*
- [x] Prepare logout requests a reason when required. *(DI-07)*
- [x] Confirm and cancel logout behave like the canonical account workflow. *(DI-07)*
- [x] Intentional logout does not trigger OCP reconnect. *(DI-07)*
- [x] Connected-only and missing-operator-snapshot paths remain deterministic. *(DI-07)*

## Abuse and Privacy

- [x] Oversized/deep messages are rejected. *(DI-03 automated)*
- [x] Connection/rate/queue limits work. *(DI-03)*
- [x] Slow consumer is disconnected without affecting desktop. *(DI-03)*
- [x] Revoked client stops receiving events immediately. *(automated + full close 2026-07-27)*
- [x] Logs contain no payloads, secrets, tokens, or unauthorized PII. *(held)*
- [x] OCP endpoint input cannot trigger SSRF. *(policy held)*

## Compatibility

- [x] Current SDK ↔ current desktop. *(unit + packaged handshake)*
- [x] Previous supported SDK ↔ current desktop. *(full close 2026-07-27 — first public RC exists)*
- [x] Current SDK ↔ previous supported desktop. *(full close 2026-07-27 — N/A prior gateway accepted)*
- [x] Unsupported protocol receives `incompatible_version` before state disclosure. *(unit + packaged)*
- [x] Desktop update/restart during an active call preserves the call and safely resynchronizes. *(full close 2026-07-27)*

## Result

- Overall: **PASS** (DI-10 full close 2026-07-27)
- Failed item IDs: none
- Sanitized evidence paths: `evidence/DI-10-compatibility-e2e-p12-close.md`
- Follow-up: SDK Mode B / stable `latest` only when human authorizes (DI-10 no longer blocks)

P12 / F-011 closed 2026-07-27 with DI-10 full close + DI-11 PASS.
