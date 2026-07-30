# F-031 per-trigger delay and Queue

**Дата:** 2026-07-30 15:24
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/integration/external-services/`
- `src/application/services/integration/external-services/`
- `src/renderer/components/settings/external-services/`

## Что
- Added v13 trigger bindings with 0–180 second validation and v12 migration.
- Added application-owned delayed-job scheduler and lifecycle cancellation.
- Added Queue tab plumbing, inline delay input, cancellation facade, and logout warning.
- Added ADR-0023, WU-13 plan registration, compact journal typography, and five-locale copy.

## Зачем
- Delayed automatic webhooks must preserve event-time snapshots without blocking telephony.

## Результат
- `npm run typecheck` PASS; `npm run i18n:check` PASS.
