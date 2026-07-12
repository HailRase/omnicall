# T-016 Headset capabilities policies (EXT-5–8)

**Дата:** 2026-07-10 17:09
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/headset/policies/`
- `src/application/headset/forwardHeadsetHardwareEvent.ts`
- `src/application/headset/HeadsetSessionOrchestrator.ts`
- `src/domain/headset/HeadsetCapabilities.ts`
- `docs/softphone/HEADSET-SYNC-CONTRACT.md`

## Что
- Capabilities guards: `holdPressed` / `supportsRejectOnHookOn` / `supportsMute`
- `headsetMutePolicy` (`absolute` default = Jabra/Poly; `toggle` tested, not in prod)
- `headsetHoldPolicy` (`hookOffResumesWhenHoldLed` default)
- `HeadsetOrchestratorPolicyContext` bundling capabilities + semantics + guards
- SyncQueue invariants documented; timers/queue internals not rewritten

## Зачем
- Явные mute/hold policies вместо vendor assumptions в Application; zero change для Jabra/Poly defaults

## Результат
- Regression gate green: 115 tests, typecheck, lint
- `supportsHold: true` не включён на production profiles
- Next optional: EXT-9 UI capabilities / EXT-11 HID picker
