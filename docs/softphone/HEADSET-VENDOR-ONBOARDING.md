# Headset Vendor Onboarding

- Purpose: checklist for adding a USB HID or SDK headset without rewriting orchestrator.
- Inputs: device specs, HID report maps or SDK API, manual smoke matrix.
- Outputs: new profile or gateway adapter, tests, registry entry.

---

## Before you start

1. Confirm `F-012` scope in `Feature-Registry.md`
2. Read `adr/ADR-0007-headset-web-hid.md` and `handoffs/P10-Headset-Extensibility-Handoff.md`
3. Run regression gate tests listed in master handoff
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
- `ledProfile` — encode/send for `HeadsetCommand` types
- `capabilities` — honest flags (`supportsHold` only after button smoke)
- `quirks` — `muteSemantics`, `holdSemantics`, `syntheticEventsOnFirstReport`

### 2. Register in `resolveHeadsetVendorProfile`

Insert **before** broader vendorId matchers, **after** more specific product IDs.

### 3. Unit tests

- Parser: fixture bytes → `hookSwitch` / `phoneMute` edges
- LED: command → output report bytes
- Edge detector integration if non-standard reports
- Registry match order test

### 4. Manual smoke matrix

| Scenario | Expected |
| --- | --- |
| Connect / disconnect | Settings panel + domain events |
| Incoming ring | `signalIncoming` LED; hookOff answers |
| Incoming reject | hookOn rejects when no active call |
| Outgoing dial | `signalOutgoing`; mute blocked |
| Active mute | absolute or toggle per `muteSemantics` |
| Hold / resume | hookOff resume or hold button per `holdSemantics` |
| Multi-call | focus policy unchanged; hangup targets focus |
| USB unplug | fault toast + disconnect |

### 5. Do not change (unless ADR)

- `resolveHeadsetSessionFocus` priority
- `HeadsetSyncQueue` timers without device evidence
- Telephony Use Cases

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

Wrong capabilities cause silent no-ops or desync — prefer false until proven.

---

## Semantics reference

| `muteSemantics` | Behavior |
| --- | --- |
| `absolute` | `muteChanged.muted` is authoritative (Poly latch, Jabra pulse collapsed) |
| `toggle` | Only act on edges per policy (not default for current vendors) |

| `holdSemantics` | Behavior |
| --- | --- |
| `hookOffResumesWhenHoldLed` | Hold LED off-hook=false; green button = resume |
| `dedicatedHoldButton` | `holdPressed` event toggles hold |

---

## Files you should not need to edit (Path A)

```txt
src/application/headset/HeadsetSessionOrchestrator.ts   # if quirks sufficient
src/application/headset/resolveHeadsetSessionFocus.ts
src/domain/headset/HeadsetCommand.ts                    # unless new command type ADR
```

---

## Completion

- [ ] Regression gate green
- [ ] Manual smoke checklist signed off
- [ ] Feature Registry `F-012` note + legacy `LF-075` if applicable
- [ ] work-history entry
