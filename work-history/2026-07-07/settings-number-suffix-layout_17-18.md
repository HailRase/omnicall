# Settings number input suffix layout fix

**Дата:** 2026-07-07 17:18
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/SettingsNumberInput.module.css`
- `src/renderer/components/settings/SettingsNumberInput.tsx`

## Что
- Отключён `flex-grow` у input в affix-группе (`flex: 0 0 auto`, фиксированная ширина 3.5rem).
- Скрыты нативные spin-button у `type="number"`.
- Убраны лишние padding от `size-md` — компактные отступы через descendant-селекторы.

## Зачем
Убрать пустую зону между цифрой и суффиксом «сек» после миграции на UI Kit Input.

## Результат
- tests/lint/typecheck: ok
