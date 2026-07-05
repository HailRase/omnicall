# Fix OcpCampaignSync integration test + campaign unit coverage

**Дата:** 2026-07-06 01:40
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/integration/OcpCampaignSync.integration.test.ts`
- `src/application/use-cases/ProcessOcpInboundMessageUseCase.test.ts`
- `src/adapters/mock/MockOcpSyncGateway.ts`, `src/adapters/index.ts`
- `docs/softphone/Feature-Registry.md`, `docs/softphone/STATUS.md`
- `src/renderer/components/settings/panels/SettingsAccountPanel.module.css.d.ts` (отдельно: sync с CSS T-011)

## Что
- Исправлена assertion в `OcpCampaignSync.integration.test.ts` (`toContain` вместо `toEqual`)
- Восстановлены mock-хелперы `createSampleOcpCampaignEventRawMessage`, `SAMPLE_OCP_CAMPAIGN_EVENT_MESSAGE`
- Добавлен unit-тест `ProcessOcpInboundMessageUseCase` для `campaign_event` + exact `main_acallid`
- Обновлены F-015 Test Coverage и STATUS.md (1189 tests)
- Синхронизирован `SettingsAccountPanel.module.css.d.ts` с актуальным CSS (без `activeProfile*`)

## Зачем
Закрыть HIGH/LOW из `/audit`: не удалять работающий integration test, восстановить F-015 campaign coverage, актуализировать docs.

## Результат
- `npm run test`: 1189 passed, 1 skipped — green
- `npm run lint` + `typecheck`: green
