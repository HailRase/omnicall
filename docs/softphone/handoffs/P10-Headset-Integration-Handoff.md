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

## Key paths

- `src/domain/headset/`
- `src/application/headset/`, `src/application/services/headset/`
- `src/adapters/headset/webhid/`
- `src/renderer/components/settings/panels/SettingsHeadsetPanel.tsx`
