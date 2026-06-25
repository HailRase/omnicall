# P11 WU5 Slice A — Shell Header CSS Modules

**Дата:** 2026-06-25 16:00
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/shells/SoftphoneShellHeader.module.css`
- `src/renderer/shells/SoftphoneShellHeader.tsx`
- `src/renderer/styles.css` (удалены header globals)
- `docs/softphone/P11-CSS-Modules-Tokens-Migration.md`
- `docs/softphone/handoffs/P11-WU5-Slice-A-Shell-Header-Handoff.md`

## Что
- Мигрирован `SoftphoneShellHeader` на CSS Modules + `clsx` + semantic tokens
- Удалены global rules `.shell__header*`, `.shell__avatar-group`, `.shell__reregister`, мёртвый `.shell__header-top`
- Обновлён migration doc (Slice A done)
- WU4 work-history закоммичен отдельно (`bfc4a22`)

## Зачем
Продолжить UI-4 (F-016): уменьшить `styles.css`, закрепить token-only стили в shell chrome.

## Результат
694 passed, 1 skipped; lint, typecheck, `ui:catalog` — OK. Следующий срез: WU5 Slice B (SettingsOverlay, ShellOverlaySheet).
