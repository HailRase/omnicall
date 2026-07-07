# Revert Input suffix fix + Windows taskbar icon scale

**Дата:** 2026-07-07 17:24
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/SettingsNumberInput.module.css`
- `src/renderer/components/settings/SettingsNumberInput.tsx`
- `scripts/build-app-icons.py`
- `build/windows-theme-icons/`
- `src/main/resolveAppIconPath.ts`
- `electron-builder.yml`

## Что
- Откат фикса layout суффикса у SettingsNumberInput (вернули min/max-width вместо flex/spin-button override).
- Добавлены `windows-theme-icons/` с artwork 927×927 (+12.5% к macOS 824).
- `resolveAppIconPath` на win32 читает `windows-theme-icons`, macOS — `theme-icons` без изменений.

## Зачем
Вернуть прежнее поведение number Input; увеличить иконку в панели задач Windows без правок macOS HIG.

## Результат
- `python scripts/build-app-icons.py` — ok
- tests/lint/typecheck — ok
