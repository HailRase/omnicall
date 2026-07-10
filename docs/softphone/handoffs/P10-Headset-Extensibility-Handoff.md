# P10 Headset Extensibility — Master Handoff

> **Mission:** make headset integration extensible (new vendors / transports) without rewriting orchestrator or breaking Jabra/Poly HID parity.
>
> **Feature:** `F-012` · **Legacy:** `LF-071`–`LF-075` · **ADR:** `adr/ADR-0007-headset-web-hid.md`
>
> **Prerequisite:** P10 WU1–WU4 + focus/sync follow-up (WU-A…H) — **done** (`P10-Headset-Integration-Handoff.md`).

---

## Why this track exists

Current architecture is sound (`HeadsetGateway` port + `HeadsetSessionOrchestrator`), but:

- Vendor byte logic is spread across `hidParsers.ts`, `hidLedOutput.ts`, `WebHidHeadsetAdapter.ts`
- `getCapabilities()` is unused in Application policies
- Bootstrap hardcodes `new WebHidHeadsetAdapter()`
- Mute/hold semantics are Jabra/Poly assumptions in `forwardHeadsetHardwareEvent`

**Goal:** new headset = new **profile** or **gateway adapter**, not orchestrator rewrite.

---

## Non-negotiable constraints

| Rule | Reason |
| --- | --- |
| `headsetEnabled=false` → zero telephony change | Opt-in integration |
| No parallel session store | ADR-0007: snapshot from projections |
| No dual runtime (jssip-phone legacy path) | Single orchestrator path |
| Do not change focus priority without ADR | WU-A…H policy lock |
| Do not rewrite `HeadsetSyncQueue` “for simplicity” | Fragile mute/hold echo parity |
| Vendor bytes stay in `src/adapters/headset/` | Architecture boundary |
| Policies stay in `src/application/headset/` | Architecture boundary |

---

## Regression gate (every WU)

Run before and after each WU:

```bash
npm run test -- HeadsetSessionOrchestrator forwardHeadsetHardwareEvent resolveHeadsetSessionFocus resolveDeviceCommandsFromSnapshot applyHeadsetSyncBusyToActiveCallControls AccountBootstrapFacade
npm run typecheck
npm run lint
```

**Must stay green:**

- `src/application/headset/HeadsetSessionOrchestrator.test.ts`
- `src/application/headset/forwardHeadsetHardwareEvent.test.ts`
- `src/application/headset/session/resolveHeadsetSessionFocus.test.ts`
- `src/application/headset/resolveDeviceCommandsFromSnapshot.test.ts`
- `src/application/projections/headset/applyHeadsetSyncBusyToActiveCallControls.test.ts`
- Headset cases in `src/application/facades/AccountBootstrapFacade.test.ts`

Manual smoke (physical Jabra or Poly) after adapter-layer WUs: see `P10-Headset-Integration-Handoff.md`.

---

## Work unit map

| WU | Title | Layer | Status | Agent prompt |
| --- | --- | --- | --- | --- |
| **EXT-0** | Regression lock baseline | docs | **done** (this handoff) | — |
| **EXT-1** | `HeadsetVendorProfile` registry | adapters | **done** | `P10-Headset-Extensibility-WU1-Agent-Prompt.md` |
| **EXT-2** | Split profiles into per-vendor files | adapters | **done** | (same prompt as EXT-1) |
| **EXT-3** | Quirks out of `WebHidHeadsetAdapter` | adapters | **done** | (same prompt as EXT-1) |
| **EXT-4** | `createHeadsetGateway()` factory | infrastructure | **done** | `P10-Headset-Extensibility-WU4-Agent-Prompt.md` |
| **EXT-5** | Wire `getCapabilities()` in orchestrator | application | **done** | `P10-Headset-Extensibility-WU5-Agent-Prompt.md` |
| **EXT-6** | Mute semantics policy (`absolute` / `toggle`) | application | **done** | `P10-Headset-Extensibility-WU5-Agent-Prompt.md` |
| **EXT-7** | Hold semantics policy | application | **done** | `P10-Headset-Extensibility-WU5-Agent-Prompt.md` |
| **EXT-8** | `HeadsetOrchestratorPolicyContext` refactor | application | **done** | `P10-Headset-Extensibility-WU5-Agent-Prompt.md` |
| **EXT-9** | Capabilities in connection projection (UI info) | application + ui | **done** | deferred after EXT-5 |
| **EXT-10** | `SdkHeadsetGatewayStub` (port sufficiency) | adapters | **done** | optional with EXT-4 |
| **EXT-11** | Electron `select-hid-device` preferred id | main | **done** | separate `/adapter` or main WU |
| **EXT-12** | Vendor onboarding doc | docs | **done** | `HEADSET-VENDOR-ONBOARDING.md` |

### Recommended order

```txt
EXT-1/2/3 → EXT-4 → EXT-5 → EXT-6/7 → EXT-8 → EXT-9
Parallel: EXT-12 (done), EXT-10, EXT-11
```

### Deferred (ADR required)

- Enable `supportsHold: true` for a specific model (physical device smoke)
- Native Jabra/Poly SDK `HeadsetGateway`
- Multi-incoming headset queue
- E2E physical device harness

---

## Anti-patterns (agents must not)

| Forbidden | Do instead |
| --- | --- |
| Vendor `if` in `forwardHeadsetHardwareEvent` | `muteSemantics` / `holdSemantics` / capabilities |
| Change focus priority casually | ADR + regression tests |
| Enable hold button for all profiles | Per-profile after device smoke |
| SDK in renderer without ADR | New gateway + factory + IPC plan |
| Big-bang `HeadsetManager` | Small WUs with regression gate |

---

## Definition of Done (each EXT WU)

- [ ] Regression gate green
- [ ] Jabra/Poly behavior parity (existing tests not weakened)
- [ ] Feature Registry `F-012` notes updated if scope/acceptance changed
- [ ] work-history entry
- [ ] New vendor path = profile file, not orchestrator edits (unless EXT-5+)

---

## Key paths

```txt
src/ports/headset/HeadsetGateway.ts
src/adapters/headset/webhid/
src/adapters/headset/               ← new: profiles/, types/
src/application/headset/
src/application/services/headset/HeadsetIntegrationService.ts
src/infrastructure/bootstrap/createRealAccountBootstrap.ts
docs/softphone/HEADSET-VENDOR-ONBOARDING.md
```

---

## Related docs

- `P10-Headset-Integration-Handoff.md` — delivered baseline
- `HEADSET-VENDOR-ONBOARDING.md` — add-new-vendor checklist
- `headset-integration/headset-integration.md` — legacy jssip-phone reference (not runtime)
