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

1. Settings → Гарнитура → enable integration → «Подключить гарнитуру» (see `HEADSET-AGENT-ONBOARDING.md` §5).
2. Incoming call: answer/reject from hook; LED ring on incoming.
3. Active call: hangup/mute from headset **and** session bar; mute LED stable on Poly.
4. Outgoing call: off-hook LED while dialing; mute blocked.

## Post-delivery fixes

| Date | Topic | Doc |
| --- | --- | --- |
| 2026-07-10 | Focus, sync guards, pulse/latch split | work-history `headset-mute-pulse-latch_*` |
| 2026-07-11 | Poly `muteEchoPolicy: swallowAll`, settings UX, projection sync | `HEADSET-AGENT-ONBOARDING.md`, work-history `poly-mute-headset-ux_13-11.md` |

## Sync contract (current)

- LED reconcile never opens mute/hold intent (`HEADSET-SYNC-CONTRACT.md`).
- Jabra pulse: echo swallows all events in window.
- Poly latch: `swallowAll` + `armHardwareMuteEcho` only on Poly `setMute` reconcile.
- Do not arm extended echo on Jabra pulse `setMute` (regression: rapid press test).

## Critical bugfixes (2026-07-10, historical)

Aligned with working `jssip-phone` reference — **superseded in part by 2026-07-11 Poly echo policy**:

- **Hold LED:** `offHook: false` + ringing — green press is `hookOff` → resume; hold sync guard swallows `hookOn` echo.
- **Hangup:** `hookOn` → focused established/outgoing; never held-only.
- **Guards:** arm only from `beginHold/MuteSessionSync` (device/UI), never from LED reconcile writes.

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

## Deferred

P10 delivery is complete; next work is **vendor/transport extensibility without orchestrator rewrite**:

| Doc | Purpose |
| --- | --- |
| `P10-Headset-Extensibility-Handoff.md` | Master WU map, regression gate, anti-patterns |
| `P10-Headset-Extensibility-WU1-Agent-Prompt.md` | EXT-1/2/3: `HeadsetVendorProfile` registry |
| `P10-Headset-Extensibility-WU4-Agent-Prompt.md` | EXT-4/10: `createHeadsetGateway` factory |
| `P10-Headset-Extensibility-WU5-Agent-Prompt.md` | EXT-5–8: capabilities + mute/hold policies |
| `HEADSET-VENDOR-ONBOARDING.md` | Add-new-vendor checklist |
| `HEADSET-AGENT-ONBOARDING.md` | **Agent map:** layers, flows, Jabra vs Poly, where to edit |

Task queue: `T-014` … `T-018` in `TASK-QUEUE.md`.

## Key paths

- **Onboarding:** `docs/softphone/HEADSET-AGENT-ONBOARDING.md`

- `src/domain/headset/`
- `src/application/headset/`, `src/application/services/headset/`
- `src/adapters/headset/webhid/`
- `src/renderer/components/settings/panels/SettingsHeadsetPanel.tsx`
