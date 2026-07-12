# P10 Headset Extensibility — EXT-1/2/3 Agent Prompt

> **Mission:** introduce `HeadsetVendorProfile` registry and move Jabra/Poly HID logic into per-vendor profiles **without changing bytes or orchestrator behavior**.

**Command:** `/adapter` (adapter layer only)  
**Feature:** `F-012` · **WU:** EXT-1, EXT-2, EXT-3  
**STOP** after adapter gate — do not touch orchestrator policies in this session.

---

## Read first (order)

1. `docs/softphone/handoffs/P10-Headset-Extensibility-Handoff.md`
2. `docs/softphone/handoffs/P10-Headset-Integration-Handoff.md` — parity baseline
3. `docs/softphone/adr/ADR-0007-headset-web-hid.md`
4. `docs/softphone/HEADSET-VENDOR-ONBOARDING.md`
5. `src/adapters/headset/webhid/WebHidHeadsetAdapter.ts`
6. `src/adapters/headset/webhid/hidParsers.ts`, `hidLedOutput.ts`, `hidConstants.ts`

---

## Current state

| Module | Responsibility today |
| --- | --- |
| `hidParsers.ts` | `resolveHidReportParser(device)` by vendorId/productId |
| `hidLedOutput.ts` | LED encode/send per vendor |
| `WebHidHeadsetAdapter.ts` | Transport + inline jabra first-report `hookOff` quirk |
| `executeHeadsetCommand.ts` | Maps `HeadsetCommand` → LED helpers |

Orchestrator (`HeadsetSessionOrchestrator`, `forwardHeadsetHardwareEvent`) is **out of scope**.

---

## Deliverables

### 1. `HeadsetVendorProfile` type

Create under `src/adapters/headset/` (adapter layer, **not** domain):

```typescript
// types/HeadsetVendorProfile.ts — shape (implement in TS)
type HeadsetMuteSemantics = "absolute" | "toggle";
type HeadsetHoldSemantics = "hookOffResumesWhenHoldLed" | "dedicatedHoldButton";

type HeadsetVendorProfile = Readonly<{
  id: string;
  match: (device: HIDDevice) => boolean;
  parser: HidReportParser;
  ledProfile: HidLedProfile;
  capabilities: HeadsetCapabilities;
  quirks?: Readonly<{
    syntheticEventsOnFirstReport?: (
      update: HidTelephonyUpdate,
    ) => ReadonlyArray<HeadsetHardwareEvent>;
    muteSemantics?: HeadsetMuteSemantics;
    holdSemantics?: HeadsetHoldSemantics;
  }>;
}>;
```

- Default `muteSemantics`: `"absolute"` (Jabra/Poly today)
- Default `holdSemantics`: `"hookOffResumesWhenHoldLed"`
- `capabilities` must match current `resolveHeadsetCapabilitiesFromParser` output per profile

### 2. Profile registry

```typescript
// resolveHeadsetVendorProfile.ts
export function resolveHeadsetVendorProfile(device: HIDDevice): HeadsetVendorProfile;
```

**Match order (preserve current behavior):**

1. Jabra HSC016 product IDs
2. Poly BW3320 product IDs
3. Jabra vendorId `0x0B0E`
4. Poly vendorId `0x047F`
5. `genericTelephony` fallback

### 3. Per-vendor profile files

```txt
src/adapters/headset/webhid/profiles/
  jabraHsc016.profile.ts
  jabraEvolve.profile.ts      # generic jabra parser today
  polyBw3320.profile.ts
  polyGeneric.profile.ts
  genericTelephony.profile.ts
```

Move parser + LED + constants references into profile files. **Byte values unchanged.**

### 4. Refactor `WebHidHeadsetAdapter`

- On attach: `const profile = resolveHeadsetVendorProfile(device)`
- `handleInputReport` uses `profile.parser`; quirks via `profile.quirks?.syntheticEventsOnFirstReport`
- `getCapabilities()` returns `profile.capabilities`
- `executeHeadsetCommand` receives profile or ledProfile from connected device context
- **Remove** inline `if (vendor === "jabra" && ...)` from adapter body

### 5. Tests

| Test | Assert |
| --- | --- |
| `resolveHeadsetVendorProfile.test.ts` | Match order for mock HIDDevice fixtures |
| Parser snapshot tests | Same `parseUpdate` output as before refactor for Jabra/Poly bytes |
| LED encode snapshot tests | Same output bytes as before refactor |
| Jabra first-report quirk | Still emits `hookOff` when hook already off on first report |
| Generic profile | No synthetic events on first report |

Run full regression gate from master handoff.

---

## Forbidden in this WU

- Edit `HeadsetSessionOrchestrator.ts`, `forwardHeadsetHardwareEvent.ts`, `HeadsetSyncQueue.ts`
- Change focus policy (`resolveHeadsetSessionFocus.ts`)
- Change bootstrap factory (EXT-4)
- Change `UserSettings` schema
- Weaken existing tests to “make refactor pass”

---

## Acceptance criteria

- [ ] Adding a new vendor = new file in `profiles/` + registry entry (demonstrate with a test-only mock profile optional)
- [ ] `WebHidHeadsetAdapter` has no vendor-specific string literals except via profile registry
- [ ] All regression gate tests green
- [ ] `npm run preflight` green
- [ ] work-history entry
- [ ] Feature Registry `F-012` — add note: vendor profiles registry introduced (no user-visible change)

---

## Gate

PASS → next prompt: `P10-Headset-Extensibility-WU4-Agent-Prompt.md`  
FAIL → refactor only; do not proceed to EXT-4
