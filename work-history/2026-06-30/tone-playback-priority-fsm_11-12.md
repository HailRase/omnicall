# Tone Playback Priority FSM (F-018)

**Дата:** 2026-06-30 11:12
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/media/` — `TonePlaybackKind`, `TonePlaybackRequest`, `resolveActiveTonePlayback`
- `src/application/services/TonePlaybackCoordinator.ts`
- `src/adapters/media/ArbiterMediaGateway.ts`
- `src/infrastructure/bootstrap/createMockAccountBootstrap.ts`, `createRealAccountBootstrap.ts`
- `docs/softphone/Feature-Registry.md` (F-018)
- `docs/softphone/MULTI-CALL-BACKLOG.md` (A2 закрыт)

## Что
- Доменная политика приоритетов: ringtone > ringback > busy/failed; FIFO при равном приоритете
- `TonePlaybackCoordinator` — stateful арбитр запросов на воспроизведение
- `ArbiterMediaGateway` — декоратор `MediaGateway` без изменений оркестраторов
- Подключение арбитра в mock и real bootstrap
- Unit + integration тесты (много входящих, входящий + активная сессия)

## Зачем
Устранить наложение тонов при multi-call: один аудиопоток, входящий всегда в приоритете, второй входящий продолжает звонить после ответа на первый.

## Результат
- `npm run test` — 858 passed, 1 skipped
- `npm run lint` — green
- `npm run typecheck` — green
