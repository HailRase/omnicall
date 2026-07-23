# Настраиваемые TTL операторских SDK-модалок

**Дата:** 2026-07-23 22:21
**Статус:** выполнено
**Коммит:** —

## Где
- `src/shared/integration/sdkOperatorModalTimeouts.ts`
- `src/shared/integration/sdkActivateTimeouts.ts`
- `src/domain/settings/SdkIntegrationSettings.ts`
- `src/renderer/hooks/useSdkSettingsPanel.ts`
- `src/renderer/components/settings/panels/SdkModuleSettingsTimeoutsSection.tsx`
- `src/adapters/integration/LocalWsServerAdapter.ts` / `sdkOriginTrustMachineStore.ts`
- `axatalk-sdk/packages/protocol/src/constants.ts`
- `docs/softphone/adr/ADR-0018-…`, `ADR-0016-…`, `Feature-Registry.md`, `I18N-Coverage.md`

## Что
- Добавлено поле `operatorModalTimeouts` в Settings (defaults 120s / 5m / 5m — без downgrade)
- UI: Settings → Axatalk SDK → Основное — три Select + i18n ru/en/fr/de/bg
- Live sync: persist → `applyPolicy` → gateway sweeper/pairing + consent bridge TTL
- Activate hop ceiling: `SDK_ACTIVATE_CLIENT_TIMEOUT_MS` = **420s** (max consent)
- Mirror Origin trust больше не затирает per-profile timeouts
- Документация ADR/Registry/protocol guides синхронизирована

## Зачем
- Оператор настраивает сроки ожидания модалок; Desktop = SSoT; CRM/SDK ждут terminal reply без коротких локальных таймеров.

## Результат
- `tsc -p tsconfig.web.json --noEmit` — OK
- focused vitest (timeouts / settings card / machine store) — OK
- `npm run i18n:check` — OK
- protocol+sdk packages rebuilt
