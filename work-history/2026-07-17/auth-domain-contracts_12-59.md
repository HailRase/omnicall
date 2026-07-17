# Auth domain contracts

**Дата:** 2026-07-17 12:59
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/settings/`
- `src/domain/integration/ocp/`
- `src/domain/shared/events/accountBootstrapEvents.ts`
- `src/application/use-cases/settings/AuthorizeSipAccountUseCase.ts`

## Что
- Добавлен typed outcome для разделения account session и SIP readiness.
- Зафиксирован монотонный lifecycle сохранённых профилей.
- Добавлены пять этапов OCP sign-in и их timeout policy.
- Добавлен sanitized rolling-24h контракт журнала уведомлений.
- SIP password исключён из manual/OCP Domain Events.

## Зачем
Создать безопасные доменные контракты для последующей оркестрации auth flow и постоянного журнала уведомлений.

## Результат
Focused tests: 15 passed. `npm run typecheck`: passed.
