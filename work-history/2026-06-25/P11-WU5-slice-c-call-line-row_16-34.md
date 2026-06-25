# P11 WU5 Slice C — CallLineRow CSS Modules

**Дата:** 2026-06-25 16:34
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/call/CallLineRow.module.css`, `CallLineRow.tsx`
- `src/renderer/styles.css` (удалены `.call-line-row*`)

## Что
- Мигрирован `CallLineRow` на CSS Modules + `clsx` (full + compact variant)
- Удалены ~150 строк global call-line rules из `styles.css`

## Зачем
Продолжить UI-4: уменьшить legacy globals для call line UX (LF-011, LF-021–023).

## Результат
694 passed, 1 skipped; lint, typecheck — OK. Следующий срез: WU5 Slice D (`Dialpad`).
