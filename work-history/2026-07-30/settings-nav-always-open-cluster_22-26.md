# Settings Integrations always-open cluster

**Дата:** 2026-07-30 22:26
**Статус:** выполнено
**Коммит:** `2306698e`

## Где
- `src/renderer/components/settings/SettingsSidebar.tsx`
- `src/renderer/components/settings/SettingsSidebarNavItems.tsx`
- `src/renderer/components/settings/settingsNavGroupAvailability.ts`
- `src/renderer/components/settings/SettingsSidebar.module.css`
- `src/renderer/components/settings/SettingsSidebar.test.tsx`
- `src/renderer/components/settings/settingsSections.ts`
- `docs/softphone/UI-Design-System.md`
- `docs/softphone/adr/ADR-AF-004-settings-authorization-gate.md`
- `docs/softphone/Feature-Registry.md`
- `docs/softphone/Icon-Registry.md`
- `docs/softphone/STATUS.md`
- `docs/softphone/handoffs/P11-Auth-Flow-Refactoring-Handoff.md`

## Что
- Убран accordion для Integrations: в expanded режиме children всегда видны
- Секция = muted sentence-case label (без uppercase); child rows выровнены с top-level
- Soft disabled + tooltip; collapsed rail — иконка группы без `nav-group` (фикс смещения disabled)
- Разделитель перед OmniCall Kit, чтобы не читался как child Integrations
- Клик по пустому chrome sidebar → toggle expand/collapse (`data-settings-nav-interactive`)
- Тесты: always-open, chrome toggle, pre-auth tooltip, collapsed children hidden
- Канон/ADR/Registry синхронизированы

## Зачем
- Nested Integrations выглядел неудобно и ломал UX переключения подпунктов
- Нужен устойчивый паттерн для будущих group children без даунгрейда гейтов ADR-0018/AF-004

## Результат
- `SettingsSidebar.test.tsx` — 22/22 PASS; Panel/Fullscreen ранее зелёные
- `eslint` на затронутых TS — PASS
- Гейты и OmniCall Kit sibling сохранены
