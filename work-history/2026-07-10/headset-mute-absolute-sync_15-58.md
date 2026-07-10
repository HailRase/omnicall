# Headset mute absolute sync (Poly/Jabra)

**Дата:** 2026-07-10 15:58
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/headset/forwardHeadsetHardwareEvent.ts`
- `src/application/headset/HeadsetSyncQueue.ts`
- `src/application/headset/HeadsetSessionOrchestrator.ts`
- `src/adapters/headset/webhid/hidEdgeDetector.ts`
- `docs/softphone/Feature-Registry.md` (F-012)

## Что
- Mute с гарнитуры переведён с «toggle только на muted:true» на absolute sync по биту mute
- Echo-lock глотает только совпадающие (redundant) события; противоположный край принимается как user override
- Обновлены unit-тесты sync queue / forward / orchestrator
- Acceptance criteria F-012 уточнены под absolute mute

## Зачем
- Устранить рассинхрон mute UI↔гарнитура при тогле с кнопки Poly/Jabra (latch absolute mute bit)

## Результат
- `npx vitest run` по headset mute-тестам: 42 passed
- Версию не бампил (bugfix → PATCH при `/release`)
