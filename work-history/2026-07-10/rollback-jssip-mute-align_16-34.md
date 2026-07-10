# Rollback jssip mute alignment

**Дата:** 2026-07-10 16:34
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/headset/forwardHeadsetHardwareEvent.ts`
- `src/application/headset/HeadsetSyncQueue.ts`
- `src/application/headset/HeadsetSessionOrchestrator.ts`
- `src/adapters/headset/webhid/WebHidHeadsetAdapter.ts`
- `src/adapters/headset/webhid/hidEdgeDetector.ts`
- тесты + `docs/softphone/Feature-Registry.md`

## Что
- Откат выравнивания mute под jssip-phone (toggle-on-true / 600ms / без syncState after LED)
- Восстановлено состояние pulse/latch: Jabra pulse, Poly latch, syncState after LED, confirmUiMuteSync

## Зачем
- Пользователь запросил откат последнего изменения

## Результат
- vitest headset mute: 42 passed
- Удалён work-history `align-mute-jssip-phone_16-27.md`
