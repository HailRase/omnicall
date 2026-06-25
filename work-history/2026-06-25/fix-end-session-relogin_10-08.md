# Fix end session after re-login

**Дата:** 2026-06-25 10:08
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/use-cases/EndUserSessionUseCase.ts`
- `src/application/facades/AccountBootstrapFacade.ts`

## Что
- Добавлен `notifySessionActive()` — сброс idempotency guard после новой SIP-регистрации
- Вызов после успешного `authorizeManualAccount` и auto-register в `initialize`
- Тесты: unit + integration re-login → logout

## Зачем
Повторный End session после повторного входа блокировался флагом `already_completed`.

## Результат
Targeted tests green; lint/typecheck green.
