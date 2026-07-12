# P10 Headset Extensibility — EXT-4/10 Agent Prompt

> **Mission:** introduce `createHeadsetGateway()` DI hook; remove hardcoded `WebHidHeadsetAdapter` from bootstrap. Optional: `SdkHeadsetGatewayStub` to validate port completeness.

**Command:** `/adapter` + infrastructure bootstrap  
**Feature:** `F-012` · **WU:** EXT-4, EXT-10 (optional)  
**Prerequisite:** EXT-1/2/3 **PASS**

---

## Read first

1. `docs/softphone/handoffs/P10-Headset-Extensibility-Handoff.md`
2. `src/infrastructure/bootstrap/createRealAccountBootstrap.ts`
3. `src/infrastructure/bootstrap/createMockAccountBootstrap.ts`
4. `src/ports/headset/HeadsetGateway.ts`

---

## Deliverables

### EXT-4: `createHeadsetGateway`

```txt
src/infrastructure/bootstrap/createHeadsetGateway.ts
```

```typescript
export type HeadsetGatewayTransport = "webhid" | "mock";

export function createHeadsetGateway(
  transport: HeadsetGatewayTransport = "webhid",
): HeadsetGateway;
```

- `createRealAccountBootstrap` → `createHeadsetGateway("webhid")`
- `createMockAccountBootstrap` → `createHeadsetGateway("mock")` or keep explicit `MockHeadsetGateway` inject (zero behavior change)
- Export from `src/infrastructure/bootstrap/` index if exists
- Unit test: factory returns correct implementation type

**Do not add** `UserSettings.headsetTransport` yet — factory is for DI only.

### EXT-10 (optional): `SdkHeadsetGatewayStub`

```txt
src/adapters/headset/sdk/SdkHeadsetGatewayStub.ts
```

- `implements HeadsetGateway`
- `isSupported(): false`
- connect/send → `operation_failed` / `not_implemented`
- Documents in ≤6 line module doc what a real SDK adapter would need (IPC, main process)
- Wire in factory behind `"sdk-stub"` only for tests — **not** default in real bootstrap

---

## Forbidden

- Change orchestrator or telephony wiring
- Add real vendor SDK dependencies
- Change `headsetEnabled` default

---

## Acceptance

- [ ] Real app still uses Web HID path identically
- [ ] Regression gate green
- [ ] Bootstrap tests green
- [ ] work-history entry

**Next:** `P10-Headset-Extensibility-WU5-Agent-Prompt.md`
