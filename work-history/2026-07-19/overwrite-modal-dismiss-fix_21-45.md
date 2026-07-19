# Overwrite modal: dismiss before sign-in + ButtonGroup footer

**Дата:** 2026-07-19 21:47
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/hooks/useAccountActions.ts`
- `src/renderer/components/account/OverwriteSavedAccountCredentialsConfirmationModal.tsx`
- `src/renderer/components/ui/dropdown-menu/DropdownMenu.tsx` (+ `.module.css`)
- `src/renderer/components/ui/alert-dialog/AlertDialog.module.css`
- `src/renderer/styles/tokens.css` (`--z-popover`)
- тесты hook/modal/`SettingsAccountPanel`
- `docs/softphone/Feature-Registry.md` (F-024), `TASK-QUEUE.md` (T-049), `CHANGELOG.md`

## Что
- Модалка перезаписи закрывается сразу при confirm (как при continue), не ждёт весь `signInAccount`.
- Восстановлен футер Cancel + ButtonGroup (continue primary, overwrite в меню).
- Follow-up: меню больше не уходит под модалку — `--z-popover`, portal в AlertDialog content, `modal={false}`, центрирование AlertDialog без `transform`.
- Регрессионный тест: dialog закрыт до settle deferred `signInAccount`.

## Зачем
Loader на «Перезаписать и войти» был UX-иллюзией (UI ждал OCP/SIP). Dropdown улетал под модалку из‑за z-index 100 &lt; modal 200 и inert/`pointer-events` у AlertDialog на body-портале.

## Результат
- Targeted tests (modal/dropdown/alert-dialog/account panel) — ok
- `lint:css` / `typecheck` — ok
