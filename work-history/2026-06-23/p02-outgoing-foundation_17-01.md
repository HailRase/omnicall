# P02 Outgoing Foundation

**Дата:** 2026-06-23 17:01
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/telephony`
- `src/application/services/CallEngine.ts`
- `src/application/use-cases/MakeCallUseCase.ts`
- `src/application/use-cases/SendDtmfUseCase.ts`
- `src/ports/telephony/TelephonyGateway.ts`
- `src/ports/media/MediaGateway.ts`
- `src/renderer/components/dialpad`
- `src/renderer/components/call`
- `docs/softphone/P02-Dialpad-UX-Design.md`
- `docs/softphone/handoffs/P02-Outgoing-Foundation-Handoff.md`

## Что
- Добавлен domain foundation для исходящих вызовов: `PhoneNumber`, `CallId`, `CallDirection`, `CallState`, `Call`, `CallStateMachine`.
- Добавлены `CallFailureReason` и domain events: `OutgoingCallRequested`, `OutgoingCallStarted`, `CallProgressReceived`, `CallAnswered`, `CallFailed`, `CallEnded`, `DtmfSent`, `DtmfFailed`, `RemoteAudioAttached`, `RingbackToneStarted`, `BusyToneStarted`, `FailedToneStarted`.
- Реализованы `CallEngine.makeCall`, `handleProgress`, `handleAnswered`, `handleFailed`, `sendDtmf`, `hangup` через `TelephonyGateway` и `MediaGateway`.
- Реализованы `MakeCallUseCase` и `SendDtmfUseCase` с валидацией номера/тона до gateway-вызовов.
- Расширены mock adapters: `MockTelephonyGateway` (success, 180/183, busy/rejected/unavailable, DTMF, hangup) и `MockMediaGateway` (ringback, busy, failed tones, remote audio, stop tone).
- Добавлены unit/integration тесты для номера, state transitions, use cases, failure reason mapping и call engine flows.
- Спроектирован UX для Dialpad (все P02 states, disabled reasons, accessibility, test IDs) и добавлены presentational компоненты Dialpad/Outgoing card + remote audio mount point.
- Добавлены UI tests для dialpad/outgoing card (`invalid`, `long press 0 -> +`, `delete/clear`, `call binding`, `dtmf mode`, `failed state`).
- Обновлён `Feature-Registry.md`: `F-003` и `F-008` переведены в `in-progress`.

## Зачем
Нужно было закрыть foundation-фазу P02, чтобы исходящий вызов и DTMF работали через чистые архитектурные границы без прямой зависимости UI от SIP.  
Это создаёт базу для следующего шага — подключения реального JsSIP-адаптера после сохранения mock-based coverage.

## Результат
- Foundation P02 реализован по слоистой схеме Domain -> Application -> Ports -> Mock Adapters -> UI projections/components.
- Проверки: `npm run test` (успех), `npm run lint` (успех), `npm run typecheck` (успех).
- Подготовлен handoff note для следующего агента с зафиксированными next steps.

