# T-034 System State SIP/OCP tabs

**Дата:** 2026-07-17 09:27
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/panels/SettingsSystemStatePanel.tsx`
- `src/renderer/components/settings/panels/SettingsSystemStateOcpTab.tsx`
- `src/renderer/hooks/useOcpSystemStateShell.ts`
- `src/renderer/components/account/AccountPanel.tsx`
- `src/renderer/components/settings/panels/OcpModuleSettingsCard.tsx`
- `docs/softphone/handoffs/P11-Auth-Flow-Refactoring-Handoff.md`

## Что
- Вкладки SIP / OCP в «Состояние системы»; OCP-вкладка через `deriveOcpSystemStateShell`
- OCP tab disabled + tooltip при `ocpIntegration.enabled === false`
- Убран persistent Server/Authorization chrome из Account и OCP Module
- Account оставляет только in-progress recovery actions
- Тесты overlay выровнены под `hasActiveAccountSession` (ADR-AF-005)

## Зачем
- Каноническая поверхность dual-FSM статуса/recovery — System State OCP tab (ADR-AF-005 / T-034)

## Результат
- `npm run test` — 2154 passed / 1 skipped
- typecheck + lint + i18n + `ui:catalog` — green
- TASK-QUEUE T-034 → done; next WU-06 (`/preflight` → `/review`)
