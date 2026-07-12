# Video calls WU1 foundation (F-026)

**Дата:** 2026-07-09 22:36
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/adr/ADR-0008-video-calls-media-mode.md`
- `docs/softphone/P13-Video-Calls-Design.md`
- `docs/softphone/Feature-Registry.md` (F-026)
- `src/domain/media/CallMediaMode.ts`, `CallVideoMediaState.ts`, `resolveVideoCallAvailability.ts`, `events/videoMediaEvents.ts`
- `src/ports/media/LocalMediaCapturePort.ts`

## Что
- Зафиксирован UX: per-call `mediaMode` + кнопка Video call вместо global `audioOnly`
- ADR-0008 и design P13 с планом WU1–WU8
- Domain: media mode, video state, availability policy, Domain events
- Port: `LocalMediaCapturePort` (opaque handles, без MediaStream в Domain)
- SIP/JsSIP audio-path не менялся (`video: false` остаётся)

## Зачем
- Заложить безопасный фундамент полного video parity без поломки текущих audio-звонков

## Результат
- Unit tests: 12/12 PASS (`CallMediaMode`, `CallVideoMediaState`, `resolveVideoCallAvailability`)
- `npm run typecheck` PASS
- Следующий шаг: WU2 settings schema или WU3 Application `mediaMode` plumbing
