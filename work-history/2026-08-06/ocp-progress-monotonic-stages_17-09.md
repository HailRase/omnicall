# OCP progress monotonic stages

**Дата:** 2026-08-06 17:09
**Статус:** выполнено
**Коммит:** `a7e61d1f`

## Где
- `src/application/projections/settings/authorizationProgressProjection.ts`
- `src/application/services/integration/OcpBackedSignInOrchestrationService.ts`
- tests: projection / derive / orchestration
- `docs/softphone/adr/ADR-AF-002-*.md`, Feature-Registry, STATUS, UX blueprint, CHANGELOG

## Что
- `applyAuthorizationExecutionStage`: запрет отката назад + prefix completed при прыжке вперёд
- `enterCredentialsWait`: не перезаписывает уже активный SIP-этап (только timeout arm)
- Тест early-creds с gated SIP authorize; обновлены expectations reconnect-from-ready
- Документация ADR-AF-002 / Registry / STATUS / Blueprint / CHANGELOG

## Зачем
- Ранние `creds` делали «Получение данных телефона» заполняющимся после «Подключение к SIP»

## Результат
- Targeted vitest suites PASS (projection, derive, orchestration, Facade sign-in, OcpSignInProgress)
