# Post-call processing trigger (F-031 / F-032)

**Дата:** 2026-07-31 13:12
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/integration/external-services/ExternalServiceEventType.ts`
- `src/application/services/integration/external-services/mapDomainEventToExternalServiceTrigger.ts`
- `src/renderer/components/settings/external-services/ExternalServicesTriggerList.tsx`
- `src/renderer/i18n/messages.ts`, `catalogs/bgMessages.ts`
- `docs/softphone/Feature-Registry.md`, `STATUS.md`, `external-services-plan/*`

## Что
- Добавлен automatic trigger code `post_call_processing` (общий для External Services и Applications)
- Маппинг `OperatorStatusChanged` → trigger только при `newStatus === POST_CALL_PROCESSING`
- Operator-level (без focus-gate), как `campaign_*`; call-переменные не заполняются
- UI switch + i18n ru/en/fr/de/bg; тесты mapper/match; синхронизация docs

## Зачем
- Автоматизации и screen-pop на входе оператора в OCP-статус «Поствызывная обработка» без костылей и без изменения OCP/SIP wire

## Результат
- `vitest` targeted: 25 passed
- `npm run typecheck` PASS
- `npm run i18n:check` PASS
- SemVer: в `[Unreleased]`; ship с ближайшим MINOR (`1.3.0` / `/release`)
