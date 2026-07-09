# Video calls WU7 incoming (F-027)

**Дата:** 2026-07-09 23:33
**Статус:** выполнено
**Коммит:** —

## Где
- `AccountBootstrapFacade.answerCallById(callId, mediaMode?)`
- `useIncomingCallActions.ts`, `useIncomingCallOverlayActions.ts`
- `IncomingCallSessionCard.tsx`, `IncomingCallOverlay.tsx`, shells

## Что
- Answer (audio) и Answer with video на карточке и overlay
- Facade/Use Case передают `mediaMode: "video"` при video answer
- Hold уже блокирует cam/screen на `CallControlsBar` (WU6)
- i18n ru/en/fr/de/bg для video answer

## Зачем
- Закрыть WU7: входящий ответ с видео без ломки audio Answer

## Результат
- `tsc` green; vitest IncomingCallSessionCard / overlay actions / i18n passed
- Следующее: WU8 SBC smoke + close F-027
