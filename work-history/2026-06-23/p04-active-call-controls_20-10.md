# P04 active call controls vertical slice

**Дата:** 2026-06-23 20:10
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/Feature-Registry.md`
- `docs/softphone/P04-Active-Call-Controls-UX-Design.md`
- `src/domain/telephony/events/callEvents.ts`
- `src/application/services/CallEngine.ts`
- `src/application/projections/activeCallControlsProjection.ts`
- `src/renderer/components/call/ActiveCallControlsPanel.tsx`

## Что
- Закрыл consistency для `F-003` и `F-008` в registry как mock-based implemented, с честным deferred scope для real JsSIP adapter и E2E harness.
- Реализовал P04 Domain Events и typed contracts: `CallHangupRequested`, `CallHeld`, `CallResumed`, `CallMuted`, `CallUnmuted`, плюс `CallEnded` в flow hangup.
- Добавил P04 Use Cases: `HangupCallUseCase`, `HoldCallUseCase`, `ResumeCallUseCase`, `MuteCallUseCase`, `UnmuteCallUseCase`.
- Расширил `TelephonyGateway` (hangup/hold/resume) и `MediaGateway` (mute/unmute), обновил mock adapters для success/failure path.
- Расширил `CallEngine` на P04 операции через трекинг call state, structured logging и observable error handling без утечки adapter sessions.
- Добавил projection и UI слой для active controls с disabled reasons из projection и accessibility labels, без business logic в React.
- Добавил тесты: FSM transitions, use cases, call engine integration, projection, renderer controls.
- Обновил `jsdom` до Node 20.17 совместимой версии для стабильного запуска `npm run test`.

## Зачем
- Перевести платформу в следующее roadmap-состояние: после P02/P03 завершить production-ready mock-based vertical slice `P04 Active Call Controls`.
- Сохранить архитектурные границы и обеспечить тестируемость/наблюдаемость критических telephony/media операций.

## Результат
- `npm run test` — успешно.
- `npm run lint` — успешно.
- `npm run typecheck` — успешно.
- P04 UX states и disabled reasons зафиксированы в отдельном UX-артефакте до UI реализации.
