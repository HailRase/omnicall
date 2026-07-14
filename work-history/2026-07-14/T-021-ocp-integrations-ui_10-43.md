# T-021 OCP Integrations Settings UI

**Дата:** 2026-07-14 10:43
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/panels/SettingsIntegrationsPanel.tsx`
- `src/renderer/components/settings/panels/OcpModuleSettingsCard.tsx`
- `src/renderer/hooks/useOcpSettingsPanel.ts`
- `src/renderer/stores/useAccountBootstrapStore.ts`
- `src/renderer/integration/ocp/createOcpToastNotificationPresenter.ts`
- `src/adapters/integration/ocp/CallbackOcpNotificationPresenter.ts`
- `src/application/read-models/OcpProjectionHub.ts`

## Что
- Добавлен Settings → Integrations с карточкой OCP Module (enabled/domain/autoConnect/autoSipAuth/token/connect)
- Иконка `settings.integrations` (Plug) + i18n ru/en/fr/de/bg
- Zustand sync OCP projections через `OcpProjectionHub.subscribe`
- Toast sink: `CallbackOcpNotificationPresenter` → `useNotifications`
- Тесты панели и toast mapping

## Зачем
Закрыть T-021 / E-06 renderer: единственная UI-поверхность конфигурации OCP (F-028).

## Результат
`npm run test` — 1937 passed, 1 skipped; `lint` / `typecheck` / `i18n:check` / `ui:catalog` — green.
