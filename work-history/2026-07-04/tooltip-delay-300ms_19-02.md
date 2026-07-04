# Tooltip hover delay 300ms

**Дата:** 2026-07-04 19:02
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/icons/iconTooltipDelay.ts`
- `docs/softphone/Feature-Registry.md`, `Icon-Registry.md`, `guides/Icon-Agent-Guide.md`
- `.cursor/rules/icons.mdc`, `ux-ui-electron-react.mdc`

## Что
- `ICON_TOOLTIP_DELAY_MS`: 1000 → 300 (0.3 с) для всех `IconTooltip` / `IconControlButton`
- `prefers-reduced-motion: reduce` по-прежнему даёт мгновенный показ
- Обновлена документация и правила агентов

## Зачем
Пользовательский запрос: более быстрый отклик tooltip при наведении.

## Результат
- Тесты IconTooltip + SettingsSidebar — green
