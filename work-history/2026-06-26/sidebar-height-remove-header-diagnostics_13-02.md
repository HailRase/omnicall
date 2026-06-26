# Sidebar item height + remove header diagnostics

**Дата:** 2026-06-26 13:02
**Статус:** выполнено
**Коммит:** —

## Где
- `SettingsSidebar.module.css`
- `SoftphoneShellHeader.tsx`, `SoftphoneReadyShell.tsx`
- `ShellHeader.stories.tsx`, `iconCatalog.ts`, `Icon-Registry.md`

## Что
- Nav items фиксированы на 40px в collapsed и expanded (убран vertical padding)
- Кнопка диагностики удалена из header; доступ через Настройки → Диагностика

## Зачем
Единая высота пунктов sidebar; диагностика только в settings.

## Результат
Тесты OK; lint, typecheck — OK.
