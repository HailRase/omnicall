# Contacts/history UI feedback fixes

**Дата:** 2026-07-08 00:18
**Статус:** выполнено
**Коммит:** —

## Где
- `ShellDialpadPanel.module.css`, `ListQuickCallButton.module.css`
- `ContactsPanelShell.tsx`, `ContactsPanelShell.module.css`
- `HistoryPanelShell.tsx`, `HistoryPanelShell.module.css`
- `iconCatalog.ts` (`action.edit`), i18n `contacts.add`

## Что
- Nav buttons: без border/outline/box-shadow
- Quick call: зелёный `--color-status-online`
- Contact list: phone + company sublines, full-row hover
- Details: red delete, outline edit + `action.edit` icon, company in card
- Dark theme: `--color-bg-surface-elevated` + border на списках/карточках
- History: missed icon `--color-status-failed`, direction icons 12px
- `contacts.add` → «Добавить» (all locales)

## Зачем
Точечная доработка по UX-фидбеку пользователя после compact polish.

## Результат
12 focused tests passed; lint, typecheck, i18n:check — green.
