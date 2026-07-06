# Settings module — UI Kit Select migration

**Дата:** 2026-07-06 23:02
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/panels/SettingsGeneralPanel.tsx`
- `src/renderer/components/settings/SettingsForm.module.css`
- `src/renderer/components/ui/select/Select.tsx`
- `src/renderer/test/setupJsdomRadix.ts`

## Что
- Native `<select>` языка заменён на UI Kit `Select` с controlled `value` / `onValueChange`
- Legacy `.language-select-group` / `.language-select` → `.language-select-field` (width wrapper)
- `Select` пробрасывает `data-testid` на trigger для catalog/tests
- `setupJsdomRadix` расширен pointer capture + scrollIntoView для Radix Select в тестах

## Зачем
- Единый UI Kit baseline для select в модуле настроек (единственный native select).

## Результат
- settings + Select tests — 57 passed; lint + typecheck — ok
