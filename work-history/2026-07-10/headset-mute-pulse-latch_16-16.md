# Headset mute pulse vs latch fix

**Дата:** 2026-07-10 16:16
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/headset/HeadsetCapabilities.ts` (`muteInputMode`)
- `src/adapters/headset/webhid/hidParsers.ts`, `hidEdgeDetector.ts`, `hidTypes.ts`
- `src/application/headset/forwardHeadsetHardwareEvent.ts`, `HeadsetSyncQueue.ts`, `HeadsetSessionOrchestrator.ts`
- `src/application/facades/AccountBootstrapFacade.ts` (confirm after headset mute)
- `docs/softphone/Feature-Registry.md` (F-012)

## Что
- Разделены политики mute: pulse (Jabra) vs latch (Poly BW3320)
- Pulse: collapse unmute release в edge detector; toggle только на muted:true; echo глотает все mute-события
- Latch: absolute mute bit; echo пропускает opposite как user override
- Headset-path после успешного mute/unmute сразу `confirmUiMuteSync` (как UI bar)
- Все Jabra-парсеры — pulse; generic Jabra обрабатывает 0x07/0x03 без ложного hook

## Зачем
- Предыдущий absolute-only fix ломал Jabra HSC016 (pulse 0x07→0x03 сразу unmute); Poly нужен latch

## Результат
- `npx vitest run` headset: 79 passed
- Нужен полный рестарт `npm run dev` (не только HMR) для проверки на железе
