# P11 WU5 Slice B — Overlay Sheets CSS Modules

**Дата:** 2026-06-25 16:32
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/SettingsOverlay.module.css`, `SettingsOverlay.tsx`
- `src/renderer/components/shell/ShellOverlaySheet.module.css`, `ShellOverlaySheet.tsx`
- `src/renderer/styles/tokens.css` (`--color-overlay-scrim`)
- `src/renderer/styles.css` (удалены overlay globals)
- `docs/softphone/handoffs/P11-WU5-Slice-B-Overlay-Sheets-Handoff.md`

## Что
- Мигрированы `SettingsOverlay` и `ShellOverlaySheet` на CSS Modules + semantic tokens
- Добавлен токен `--color-overlay-scrim` для backdrop
- Удалены `.settings-overlay*` и `.shell-overlay-sheet*` из `styles.css`

## Зачем
Продолжить UI-4 (F-016): уменьшить legacy globals, закрепить token-only стили в overlay sheets.

## Результат
694 passed, 1 skipped; lint, typecheck, `ui:catalog` — OK. Следующий срез: WU5 Slice C (`CallLineRow`).
