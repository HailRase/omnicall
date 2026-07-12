# P10 Headset Extensibility — EXT-5/6/7/8 Agent Prompt

> **Mission:** capabilities-driven policies and explicit mute/hold semantics — **without changing Jabra/Poly default behavior**.

**Command:** `/logic`  
**Feature:** `F-012` · **WU:** EXT-5, EXT-6, EXT-7, EXT-8  
**Prerequisite:** EXT-1 **PASS** (profiles expose `quirks.muteSemantics` / `holdSemantics` / `capabilities`)

---

## Read first

1. `docs/softphone/handoffs/P10-Headset-Extensibility-Handoff.md`
2. `src/application/headset/HeadsetSessionOrchestrator.ts`
3. `src/application/headset/forwardHeadsetHardwareEvent.ts`
4. `src/application/headset/HeadsetSyncQueue.ts` — read-only; document invariants, do not rewrite

---

## Deliverables

### EXT-5: Capabilities in orchestrator

- Add to orchestrator deps: `getCapabilities: () => HeadsetCapabilities` (from gateway)
- `forwardHeadsetHardwareEvent`:
  - `holdPressed` → no-op when `!capabilities.supportsHold` (already effectively true)
  - `hookOn` reject path → respect `capabilities.supportsRejectOnHookOn`
- Jabra/Poly profiles keep current capability flags (`supportsHold: false`, etc.)
- New unit tests for capability guards

### EXT-6: `headsetMutePolicy.ts`

```txt
src/application/headset/policies/headsetMutePolicy.ts
```

```typescript
export type HeadsetMuteSemantics = "absolute" | "toggle";

export function shouldApplyHardwareMuteChange(
  semantics: HeadsetMuteSemantics,
  eventMuted: boolean,
  snapshotFocusedMuted: boolean,
): boolean;
```

- Wire semantics from profile quirks via gateway or a thin `HeadsetDeviceTraits` reader on connect
- **Default `absolute`** → identical to current `forwardHeadsetHardwareEvent` mute branch
- Add `toggle` tests only; do not enable `toggle` in production profiles yet

### EXT-7: `headsetHoldPolicy.ts`

```typescript
export type HeadsetHoldSemantics =
  | "hookOffResumesWhenHoldLed"
  | "dedicatedHoldButton";

export function resolveHoldActionFromHookOff(...): "resume" | null;
```

- Extract `resumeFocusedHeld` logic from `forwardHeadsetHardwareEvent`
- Default semantics = current Jabra/Poly behavior

### EXT-8: `HeadsetOrchestratorPolicyContext`

Thin refactor bundling:

- `capabilities`, `muteSemantics`, `holdSemantics`
- `queue`, `guards`, `hookGuard`, `acceptGuard`

**Pure refactor** — same branches, same timers, same tests green.

---

## SyncQueue invariants (do not break)

Document in module header or `docs/softphone/HEADSET-SYNC-CONTRACT.md` (≤30 lines):

1. LED reconcile (`enqueueCommands` from snapshot) **never** calls `beginHold/MuteSessionSync`
2. Guards arm only from UI or hardware intent paths
3. `lastSnapshot` stale retry after intent clear is intentional (orchestrator comment)
4. Mute echo windows: `MUTE_ECHO_MS`, `HOLD_LED_MUTE_ECHO_MS` — change only with device evidence

---

## Forbidden

- Change `resolveHeadsetSessionFocus` priority
- Set `supportsHold: true` on any production profile
- Remove absolute mute behavior for Jabra/Poly
- Rewrite `HeadsetSyncQueue` internals

---

## Acceptance

- [ ] All existing orchestrator + forward tests green
- [ ] New policy unit tests for `absolute` vs `toggle` (toggle not in prod profiles)
- [ ] `npm run preflight` green
- [ ] work-history entry
- [ ] Feature Registry `F-012` updated if acceptance criteria extended

**Next (optional):** EXT-9 capabilities in UI projection, EXT-11 Electron HID picker
