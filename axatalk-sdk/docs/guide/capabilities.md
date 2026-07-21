# Capabilities Matrix

Authorization is **server-issued**. The client may *request* non-privileged caps at
pairing; the desktop decides grants. Privileged caps are **never** pairing-default.

## IDs (protocol)

| Capability | Privileged? | Typical use |
| --- | --- | --- |
| `session.read.redacted` | No | Snapshot / events |
| `window.show` | No | `client.window.show` |
| `window.hide` | **Yes** | **Unavailable in v1 product** — do not ship |
| `operator.status.write` | No | `client.operator.changeStatus` |
| `call.originate` | No | `client.calls.originate` |
| `call.control` | No | answer/reject/hangup/hold/mute/DTMF |
| `session.logout` | No | prepare/confirm logout |
| `account.activate` | **Yes** | `client.account.activateProfile` — desktop grant only |

## Profile defaults (pairing approve)

| Profile | Default caps (non-privileged) |
| --- | --- |
| `presentation` | `session.read.redacted`, `window.show` |
| `operator` | presentation + `operator.status.write`, `session.logout` |
| `call_controller` | operator + `call.originate`, `call.control` |

Source: `@axata/axatalk-protocol` `DEFAULT_CAPABILITY_PROFILES`.  
`account.activate` and `window.hide` are **never** in these defaults.

## Client sanitize (always)

On every pairing request the SDK runs `sanitizeRequestedCapabilities`:

1. Drop every privileged id (`account.activate`, `window.hide`).
2. Keep only caps that belong to the requested profile defaults.
3. Fail closed to profile defaults if the list would be empty.

Teaching `requestedCapabilities: ['account.activate']` as a working pattern is a
**documentation defect**. It never elevates privilege.

## Runtime grant / revoke

| Signal | Host next step |
| --- | --- |
| Cap missing on mutation | Typed `forbidden` — show “capability not granted” |
| `sdk:permission-changed` (internal) → session caps update | Re-read `getGrantedCapabilities()`; disable UI |
| Mid-session revoke of `account.activate` | Subsequent activate → `forbidden` |
| Desktop TTL expiry for **session** `account.activate` grant | Desktop-owned; SDK sees missing cap / `forbidden`. This is **not** a lasting skip-consent TTL — ADR-0018 still requires a renderer consent modal on **every** activate when Origin policy allows |

Desktop operators elevate `account.activate` in Settings (DI-09). The SDK never
invents a grant UI.
