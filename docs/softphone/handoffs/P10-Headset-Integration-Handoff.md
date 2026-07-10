# P10 Headset Integration Handoff

- Scope: `F-012` optional USB headset integration (`LF-071`–`LF-075`) via Web HID v1.
- ADR: `adr/ADR-0007-headset-web-hid.md`
- Default: `UserSettings.headsetEnabled = false` (schema v4).

## Delivered (WU1–WU4)

| WU | Deliverable |
| --- | --- |
| WU1 | Domain types/events, `HeadsetGateway` port, `MockHeadsetGateway`, snapshot builder, orchestrator policies, settings migration, unit tests |
| WU2 | `WebHidHeadsetAdapter`, vendor profiles (Jabra/Poly), Electron `setupHidPermissions`, bootstrap wiring |
| WU3 | Live orchestrator ↔ facade Use Cases, LED reconcile, `headsetSyncBusy` projection, active-call control blocking |
| WU4 | `SettingsHeadsetPanel`, i18n (ru/en/fr/de/bg), Storybook + tests, registry/legacy evidence |

## Gate evidence

- `npm run typecheck` — green
- `npm run test` — 1575+ passed
- `npm run lint` — green
- `npm run i18n:check` — green
- Softphone unchanged when `headsetEnabled=false`

## Manual smoke (device)

1. Enable headset in Settings → connect USB Jabra or Poly device.
2. Incoming call: answer/reject from hook; LED ring on incoming.
3. Active call: hangup/mute from headset; hold/mute UI blocked during sync.
4. Outgoing call: off-hook LED while dialing.

## Deferred

- Native Jabra/Poly SDK adapters (new `HeadsetGateway` implementation).
- E2E harness with physical device automation.
- Headset hold button (profiles set `supportsHold: false` per reference).
- Multi-incoming queue (single incoming projection remains in scope).

## Follow-up (focus / multi-session parity)

| WU | Status | Notes |
| --- | --- | --- |
| WU-A Focus contract | **done** | `resolveHeadsetSessionFocus`: incoming → outgoing → selected → primary → active → held |
| WU-B LED from focus | **done** | LED priority: incoming ring > focus presence > mute; no mute+hold combo |
| WU-C Hardware → focus | **done** | hangup/mute/resume target `focusSessionId` (hangup includes Held) |
| WU-D UI sync guards | **done** | UI hold/mute/resume arms `HeadsetSyncQueue` via facade; busy listener refreshes projection |
| WU-E DND wiring | **done** | `isDnd` from account `phoneStatus === "dnd"` into headset answer guard |
| WU-F Error notifications | **done** | `HeadsetFaultOccurred` + toast; USB unplug = disconnect + toast (no failover) |
| WU-G Regression gate | **done** | headset unit/projection/notification tests; i18n keys; typecheck |
| WU-H Policy lock (2026-07-10) | **done** | Q1 hangup=focus; Q2 mute=focus incl. Held; Q3 outgoing captures focus; Q6 post-answer stays on answered |

## Critical bugfixes (2026-07-10)

Aligned with working `jssip-phone` `forwardDeviceEventToApp` / orchestrator / `syncLedOnHold`:

- **Mute:** toggle only on `muteChanged.muted === true` (ignore unmuted bounce); do not re-arm mute guard on LED `setMute`.
- **Hold LED:** `offHook: false` + ringing — green press is `hookOff` → resume; hold sync guard (2s) swallows `hookOn` echo from LED write.
- **Hangup:** `hookOn` → `activeSessionId` / outgoing only; never held-only.
- **Guards:** arm only from `beginHold/MuteSessionSync` (device/UI), never from LED reconcile writes.

## Key paths

- `src/domain/headset/`
- `src/application/headset/`, `src/application/services/headset/`
- `src/adapters/headset/webhid/`
- `src/renderer/components/settings/panels/SettingsHeadsetPanel.tsx`
