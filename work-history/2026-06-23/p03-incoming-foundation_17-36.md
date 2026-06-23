# P03 Incoming Call Foundation

**Дата:** 2026-06-23 17:36
**Статус:** выполнено
**Коммит:** `—`

## Где
- `src/domain/telephony/`
- `src/application/services/CallEngine.ts`
- `src/application/use-cases/`
- `src/application/projections/`
- `src/ports/`
- `src/adapters/`
- `src/renderer/components/call/`
- `docs/softphone/`

## Что
- Добавлены недостающие incoming события: `IncomingCallEndedBeforeAnswer`, `IncomingRingtoneStopped`, плюс обновлены exports в Domain.
- Добавлены модели `CallerIdentity`, `IncomingCall`, `RejectReason` и безопасный parser boundary с нормализацией.
- Расширен Application слой use-cases: `HandleIncomingCallUseCase`, `SelectRejectReasonUseCase`, `AutoAnswerIncomingCallUseCase`, `RejectIncomingCallByDndUseCase`.
- В `CallEngine` добавлены stop/start ringtone через `MediaGateway.playRingtone/stopRingtone`, cleanup auto-answer timer и корректная обработка ended-before-answer.
- Переработан incoming UX: точные state names (`noIncomingCall`, `callerIdentityLoading`, `dndAutoRejecting`, `incomingEndedBeforeAnswer`), keyboard Enter/Escape и focus trap в modal.
- Обновлены integration/unit/UI тесты под DoD, включая ended-before-answer recovery, auto-answer timeout, invalid state failures и keyboard behavior.

## Зачем
- Цель — закрыть foundation входящего вызова в фазе P03 без нарушения архитектурных границ между UI, Application, Domain, Ports и Adapters.
- Это обеспечивает event-driven входящий поток, DND/auto-answer поведение и совместимость с legacy event `soft-phone-break-reason`.

## Результат
- Реализован полный вертикальный срез incoming call: adapter event -> Domain Event -> CallEngine -> projection -> UI.
- Проверки: `npm run test` (успешно), `npm run lint` (успешно), `npm run typecheck` (успешно).
- Архитектурно подтверждено: UI не вызывает SIP напрямую, store остаётся projection-only, OCP остаётся optional.
