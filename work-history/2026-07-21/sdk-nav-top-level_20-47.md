# Axatalk SDK top-level Settings nav

**Дата:** 2026-07-21 20:47
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/settingsSections.ts`
- `src/renderer/components/settings/SettingsSidebar.test.tsx`
- `docs/softphone/adr/ADR-0018-…`, `ADR-AF-004-…`
- `docs/softphone/Feature-Registry.md`
- `docs/softphone/handoffs/P11-Auth-Flow-Refactoring-Handoff.md`

## Что
- Axatalk SDK вынесен из children Integrations в top-level leaf сразу под группой Integrations
- Pre-auth: Integrations/OCP disabled; `settings-nav-integrations-sdk` enabled
- Обновлены ADR / Registry / handoff и sidebar tests

## Зачем
- IA: Настройки → Axatalk SDK (рядом под Интеграциями), без вложенности в OCP-группу

## Результат
- `npx vitest run SettingsSidebar.test.tsx deriveSettingsNavigationAvailability.test.ts` — 18 passed
