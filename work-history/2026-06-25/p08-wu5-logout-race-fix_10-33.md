# P08 WU5 logout concurrent race fix

**Дата:** 2026-06-25 10:33
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/services/SessionTeardownOrchestrationService.ts`
- `src/application/use-cases/EndUserSessionUseCase.ts`
- `src/application/services/SessionTeardownOrchestrationService.test.ts`
- `src/application/use-cases/EndUserSessionUseCase.test.ts`

## Что
- Concurrent teardown: `already_in_progress` → `err` вместо ложного `ok({ steps: [] })`
- `teardownInProgress` сбрасывается в `finally`
- `EndUserSessionUseCase`: не публикует `UserSessionEnded` при err или пустых steps
- Тесты: concurrent teardown + no UserSessionEnded on in-progress

## Зачем
Исключить ложный сброс UI в `sip_only_ready` при двойном logout / параллельном teardown.

## Результат
`npm run test` 619 passed, 1 skipped; lint/typecheck green.
