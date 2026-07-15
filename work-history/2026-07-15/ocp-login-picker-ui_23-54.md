# OCP Integrations login picker UI (T-031)

**Дата:** 2026-07-15 23:54
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/hooks/useOcpSettingsPanel.ts`
- `src/renderer/components/settings/panels/OcpModuleSettingsCard.tsx`
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `src/renderer/i18n/messages.ts`, `src/renderer/i18n/catalogs/bgMessages.ts`

## Что
- Поле Login в OCP Integrations: plain Input без профилей; Input + datalist при saved profiles
- Хук scoped на `getOcpModulePanelState` / `connectOcp({ login, accountKey })`
- Connect и domain/api-key недоступны без login
- i18n ru/en/fr/de/bg для login / hints / loginAmbiguous

## Зачем
Сделать явным, под каким пользователем идёт OCP Connect в Integrations, без даунгрейда SIP.

## Результат
- `npm run test` — 2065 passed, 1 skipped
- `npm run lint` / `typecheck` / `ui:catalog` — PASS
- T-031 → done; следующий `/preflight` → `/review`
