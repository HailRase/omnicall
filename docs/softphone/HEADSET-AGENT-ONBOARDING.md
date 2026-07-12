# Headset Integration — Agent Onboarding

- **Feature:** F-012 (`LF-071`–`LF-075`)
- **Phase:** P10 (implemented)
- **ADR:** `adr/ADR-0007-headset-web-hid.md`
- **Default:** `UserSettings.headsetEnabled = false` (opt-in)

> **Read this first** before any headset bugfix, vendor profile, or settings UI work.  
> Add-vendor checklist: `HEADSET-VENDOR-ONBOARDING.md`. Sync invariants: `HEADSET-SYNC-CONTRACT.md`.

---

## 1. What lives where (layer map)

```txt
RENDERER (UI only — no HID, no SIP)
  SettingsHeadsetPanel.tsx          → toggles, connect CTA, status hints
  useSettingsActions.ts             → persist settings, list granted devices
  useAccountBootstrapStore.ts       → headsetConnectionProjection, sync busy
  CallControlsBar.tsx               → mute/hold; busy via headsetSyncBusyProjection
  useCallLinesActions.ts            → muteCallById → facade

APPLICATION (orchestration — no vendor bytes)
  AccountBootstrapFacade.ts         → muteCallById, applyHeadsetUserSettings, connect
  HeadsetIntegrationService.ts      → lifecycle, auto-reconnect, orchestrator start
  HeadsetSessionOrchestrator.ts     → device↔app sync, LED reconcile, hardware events
  HeadsetSyncQueue.ts               → mute/hold intent, echo windows, UI busy
  forwardHeadsetHardwareEvent.ts    → headset button → Use Case callbacks
  resolveDeviceCommandsFromSnapshot.ts → snapshot delta → HeadsetCommand[]
  buildHeadsetCallSnapshot.ts       → telephony projections → focus/mute flags
  session/resolveHeadsetSessionFocus.ts → focus priority contract
  policies/headsetMutePolicy.ts     → absolute vs toggle semantics
  projections/headset/              → headsetConnectionProjection, sync busy

DOMAIN + PORTS
  domain/headset/                   → HeadsetCommand, events, HeadsetCapabilities
  ports/headset/HeadsetGateway.ts   → connect, send, subscribe, listGrantedDevices

ADAPTERS (vendor bytes only here)
  adapters/headset/webhid/
    WebHidHeadsetAdapter.ts         → HID transport, edge detector, LED send
    resolveHeadsetVendorProfile.ts  → profile registry (order matters)
    profiles/                       → jabra*, poly*, genericTelephony
    hidEdgeDetector.ts              → pulse vs latch input edges
    hidLedOutput.ts                 → executeHeadsetCommand / syncLedMute
  adapters/mock/MockHeadsetGateway.ts → unit tests

ELECTRON MAIN (permissions only)
  main/index.ts                     → setupHidPermissions, select-hid-device IPC
  main/headset/pickSelectHidDevice.ts
  main/headset/preferredSoftphoneHidDeviceStore.ts
```

**Never:** call `navigator.hid` from React; parse HID bytes in Application; put telephony rules in adapters.

---

## 2. Runtime flows (where to debug)

### 2.1 User connects headset (Settings)

```txt
SettingsHeadsetPanel → onConnectHeadset
  → AccountBootstrapFacade.connectHeadsetDevice
  → ConnectHeadsetDeviceUseCase / gateway.connectGrantedDevice
  → WebHidHeadsetAdapter (requestDevice or attach granted)
  → resolveHeadsetVendorProfile → attachDevice
  → HeadsetConnected domain event → headsetConnectionProjection
  → HeadsetIntegrationService.orchestrator.onDeviceConnected()
```

**Auto-reconnect after login** (silent if no HID grant):

```txt
authorize / initialize / saveUserSettings
  → applyHeadsetUserSettings
  → if headsetEnabled && headsetAutoReconnect
       → TryHeadsetAutoReconnectUseCase
       → pickGrantedHidDevice(preferredId || first granted)
```

**Prerequisite:** user must grant HID once via «Подключить гарнитуру»; auto-reconnect only re-attaches **granted** devices.

### 2.2 Mute from session control bar (app → device)

```txt
CallControlsBar → muteCallById
  → beginUiMuteSync (HeadsetSyncQueue)
  → MuteCallUseCase / UnmuteCallUseCase
  → confirmUiMuteSync
  → notifyHeadsetProjectionsChanged
  → HeadsetSessionOrchestrator.onSnapshotChanged
  → resolveDeviceCommandsFromSnapshot → setMute
  → gateway.send(setMute) → syncLedMute + syncEdgeDetectorAfterLedCommand
```

**Contract:** LED reconcile **never** calls `beginMuteSessionSync`. Echo after Poly `setMute` uses `armHardwareMuteEcho` when `muteEchoPolicy === "swallowAll"`.

### 2.3 Mute from headset button (device → app)

```txt
HID input → WebHidHeadsetAdapter.handleInputReport
  → profile.parser + hidEdgeDetector
  → HeadsetHardwareEvent muteChanged
  → HeadsetSessionOrchestrator.handleHardwareEvent
  → shouldIgnoreHardwareMuteEvent (echo / intent lock)
  → forwardHeadsetHardwareEvent
  → beginMuteSessionSync → callbacks.onSetMute
  → muteCall / unmuteCall Use Case → confirmUiMuteSync
  → onSnapshotChanged → setMute LED reconcile
```

### 2.4 Focus priority (which call gets headset actions)

```txt
resolveHeadsetSessionFocus:
  incoming waiting → outgoing in progress → operator selected
  → primary → active → held
```

File: `src/application/headset/session/resolveHeadsetSessionFocus.ts`. Change only with ADR.

---

## 3. Jabra vs Poly (do not unify blindly)

| Aspect | Jabra (pulse) | Poly (latch) |
| --- | --- | --- |
| Profiles | `jabraHsc016`, `jabraEvolve`, generic Jabra | `polyBw3320`, `poly-generic` |
| USB vendorId | `0x0b0e` | `0x047f` |
| `muteInputMode` | `pulse` | `latch` |
| Hardware mute | Toggle on `muted:true` only; release ignored in edge detector | Absolute mute bit |
| `muteEchoPolicy` | `matchOnly` (pulse swallows all in echo via mode) | **`swallowAll`** (firmware LED bounce) |
| LED | Combined report (Evolve) or standard | BW3320: 3 separate LED reports |
| Typical bug | Release bounce | Opposite bit after LED sync → mute flicker |

**Regression rule:** fix Poly in profile + echo policy; verify Jabra pulse test in `HeadsetSessionOrchestrator.test.ts` («pulse mode ignores unmute bounce»).

---

## 4. HeadsetSyncQueue (mute/hold locks)

| Mechanism | Purpose |
| --- | --- |
| `beginMuteSessionSync` / `beginHoldSessionSync` | UI or hardware intent; blocks duplicate toggles |
| `confirmUiMuteSync` / `clearMuteSyncIfMatched` | Clear intent after Use Case success |
| `shouldIgnoreHardwareMuteEvent` | Swallow firmware echo vs real user press |
| `armHardwareMuteEcho(600ms)` | After hold/resume LED or Poly `setMute` reconcile |
| `getBusyState` | Session bar spinner (`headset_sync_in_progress`) |

Full invariants: `HEADSET-SYNC-CONTRACT.md`.

---

## 5. Settings UI (operator journey)

Panel: `SettingsHeadsetPanel.tsx`

| Step | User action | Code path |
| --- | --- | --- |
| 1 | Open Settings → Гарнитура | `settingsSections.ts` |
| 2 | Enable «Включить интеграцию» | `headsetEnabled` → `saveUserSettings` → `applyHeadsetUserSettings` |
| 3 | Click «Подключить гарнитуру» | `onConnectHeadset(null)` → HID picker |
| 4 | Select device in OS dialog | Electron `select-hid-device` + profile match |
| 5 | Next login | auto-reconnect if grant exists + `headsetAutoReconnect` |

**Projection sync:** `mergeHeadsetUserSettingsIntoProjection` updates `isEnabled` / `autoReconnect` on settings load/save (store must not show «Интеграция выключена» when toggle is on).

Per-account fields (schema v5): `headsetEnabled`, `headsetAutoReconnect`, `headsetPreferredDeviceId`.

---

## 6. Decision tree — where to change code

| Task | Layer | Files |
| --- | --- | --- |
| New USB vendor / model | Adapter profile | `profiles/*.profile.ts`, `resolveHeadsetVendorProfile.ts` |
| Wrong HID bytes / LED | Adapter | profile parser, `ledProfiles.ts`, `hidLedOutput.ts` |
| Mute flicker / echo | Application + profile | `HeadsetSyncQueue`, `HeadsetSessionOrchestrator`, `muteEchoPolicy` on profile |
| Headset button ignored | Application | `forwardHeadsetHardwareEvent`, focus policy, `canToggleMuteFromHeadset` |
| UI bar mute stuck loading | Application + projection | `HeadsetSyncQueue` UI busy, `applyHeadsetSyncBusyToActiveCallControls` |
| Connect / auto-reconnect | Application + adapter | `HeadsetIntegrationService`, `pickGrantedHidDevice.ts` |
| Settings copy / layout | Renderer + i18n | `SettingsHeadsetPanel`, `messages.ts`, `bgMessages.ts` |
| HID permission / picker | Main | `main/index.ts`, `pickSelectHidDevice.ts` |

---

## 7. Tests to run before merge

```bash
npx vitest run src/application/headset src/adapters/headset src/application/projections/headset
npx vitest run src/renderer/components/settings/panels/SettingsHeadsetPanel.test.tsx
npm run i18n:check
npm run typecheck
```

Manual smoke (physical device, **full restart** `npm run dev`):

1. Jabra: incoming answer, active mute bar + headset, hold/resume if supported
2. Poly: same + verify mute LED stable (no off→on flicker)
3. Outgoing dial: mute blocked; LED outgoing
4. `headsetEnabled=false`: zero headset side effects

---

## 8. Related docs

| Doc | Use when |
| --- | --- |
| `HEADSET-VENDOR-ONBOARDING.md` | Adding a new vendor profile |
| `HEADSET-SYNC-CONTRACT.md` | Changing sync timers or invariants |
| `handoffs/P10-Headset-Integration-Handoff.md` | Phase gate history |
| `handoffs/P10-Headset-Extensibility-Handoff.md` | EXT track, regression gate |
| `Feature-Registry.md` F-012 | Acceptance criteria |
| `work-history/2026-07-11/poly-mute-headset-ux_13-11.md` | Poly mute + settings UX fix |

---

## 9. Anti-patterns (Blocker)

- Changing `HeadsetSyncQueue` timers without device evidence or contract update
- Calling `beginMuteSessionSync` from LED reconcile path
- `matchOnly` latch echo for Poly (causes flicker)
- `armHardwareMuteEcho` on every `setMute` for pulse devices (breaks Jabra rapid press test)
- Business rules in `SettingsHeadsetPanel` or `WebHidHeadsetAdapter`
- Default `headsetEnabled=true` without ADR
