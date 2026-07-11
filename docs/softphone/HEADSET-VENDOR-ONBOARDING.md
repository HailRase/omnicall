# Headset Vendor Onboarding

- Purpose: checklist for adding a USB HID or SDK headset without rewriting orchestrator.
- Inputs: device specs, HID report maps or SDK API, manual smoke matrix.
- Outputs: new profile or gateway adapter, tests, registry entry.
- **Architecture map:** `HEADSET-AGENT-ONBOARDING.md` (read first).

---

## Before you start

1. Confirm `F-012` scope in `Feature-Registry.md`
2. Read `adr/ADR-0007-headset-web-hid.md`, `HEADSET-AGENT-ONBOARDING.md`, `HEADSET-SYNC-CONTRACT.md`
3. Read `handoffs/P10-Headset-Extensibility-Handoff.md` for regression gate
4. Prefer **profile-only** change; touch Application only if semantics differ

---

## Path A — Web HID telephony device

### 1. Create profile file

```txt
src/adapters/headset/webhid/profiles/<vendorModel>.profile.ts
```

Implement `HeadsetVendorProfile`:

- `match(device)` — vendorId + productId set (specific before generic)
- `parser.parseUpdate(reportId, data)` → `HidTelephonyUpdate`
- `parser.muteInputMode` — `pulse` (press/release) or `latch` (absolute bit)
- `ledProfile` — encode/send for `HeadsetCommand` types
- `capabilities` — honest flags + **`muteEchoPolicy`**
- `quirks` — `muteSemantics`, `holdSemantics`, `syntheticEventsOnFirstReport`

### 2. Choose mute echo policy

| Device behavior | Set on profile `capabilities` |
| --- | --- |
| Press/release mute (Jabra) | `muteInputMode: "pulse"`, `muteEchoPolicy: "matchOnly"` |
| Absolute mute bit + LED bounce on sync (Poly) | `muteInputMode: "latch"`, **`muteEchoPolicy: "swallowAll"`** |
| Absolute bit, no LED bounce (rare) | `muteInputMode: "latch"`, `muteEchoPolicy: "matchOnly"` |

Wrong policy → mute flicker (Poly) or blocked rapid presses (Jabra). See `HEADSET-SYNC-CONTRACT.md`.

### 3. Register in `resolveHeadsetVendorProfile`

Insert **before** broader vendorId matchers, **after** more specific product IDs.

Current order (reference):

```txt
jabra-hsc016 → jabra-evolve → poly-bw3320 → poly-generic → generic-telephony
```

### 4. Unit tests

- Parser: fixture bytes → `hookSwitch` / `phoneMute` edges
- LED: command → output report bytes
- `resolveHeadsetVendorProfile.test.ts`: match order + `muteEchoPolicy`
- Edge detector integration if non-standard reports

### 5. Manual smoke matrix

| Scenario | Expected |
| --- | --- |
| Connect / disconnect | Settings panel + domain events |
| Incoming ring | `signalIncoming` LED; hookOff answers |
| Incoming reject | hookOn rejects when no active call |
| Outgoing dial | `signalOutgoing`; mute blocked |
| Active mute (bar + headset) | Stable toggle; LED matches app mute |
| Hold / resume | hookOff resume or hold button per `holdSemantics` |
| Multi-call | focus policy unchanged; hangup targets focus |
| USB unplug | fault toast + disconnect |

### 6. Do not change (unless ADR)

- `resolveHeadsetSessionFocus` priority
- `HeadsetSyncQueue` timers without device evidence + contract update
- Telephony Use Cases
- `armHardwareMuteEcho` on all vendors for every `setMute` (Jabra regression)

---

## Path B — Native SDK (future)

1. Implement `HeadsetGateway` in `src/adapters/headset/<vendor>/`
2. Map SDK events → `HeadsetHardwareEvent`
3. Map `HeadsetCommand` → SDK calls
4. Register in `createHeadsetGateway()` factory
5. ADR for main-process / IPC if SDK cannot run in renderer
6. Reuse orchestrator unchanged if semantics match Path A defaults

---

## Capability honesty

| Flag | Enable only when |
| --- | --- |
| `supportsHold` | Dedicated hold button tested on device |
| `supportsRejectOnHookOn` | hookOn rejects incoming without active call |
| `supportsMute` | Mute bit/button reliable with sync queue |
| `muteEchoPolicy` | Set from firmware LED bounce observation, not guess |

Wrong capabilities cause silent no-ops or desync — prefer false until proven.

---

## Semantics reference

| `muteSemantics` | Behavior |
| --- | --- |
| `absolute` | `muteChanged.muted` is authoritative (Poly latch; Jabra after edge collapse) |
| `toggle` | Only act on edges per policy (not default for current vendors) |

| `holdSemantics` | Behavior |
| --- | --- |
| `hookOffResumesWhenHoldLed` | Hold LED off-hook=false; green button = resume |
| `dedicatedHoldButton` | `holdPressed` event toggles hold |

---

## Files you should not need to edit (Path A, typical)

```txt
src/application/headset/HeadsetSessionOrchestrator.ts   # if quirks + muteEchoPolicy sufficient
src/application/headset/resolveHeadsetSessionFocus.ts
src/domain/headset/HeadsetCommand.ts                    # unless new command type ADR
src/renderer/components/settings/panels/SettingsHeadsetPanel.tsx  # unless UX copy only
```

---

## Completion

- [ ] Regression gate green (`HEADSET-AGENT-ONBOARDING.md` §7)
- [ ] Manual smoke checklist signed off
- [ ] Feature Registry `F-012` note + legacy `LF-075` if applicable
- [ ] work-history entry
