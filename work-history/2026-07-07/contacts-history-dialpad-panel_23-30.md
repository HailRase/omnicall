# Contacts/history dialpad panel UI

**Дата:** 2026-07-07 23:30
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/shell/ShellDialpadPanel.tsx`
- `src/renderer/components/shell/ShellDialpadPanel.module.css`
- `src/renderer/components/contacts/ContactsPanelShell.tsx`
- `src/renderer/components/history/HistoryPanelShell.tsx`
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `src/renderer/widgets/SoftphoneLayout/SoftphoneLayout.module.css`
- `src/renderer/styles/tokens.css`

## Что
- Добавлен `ShellDialpadPanel` — нижний блок поверх dialpad с slide-up/slide-down анимацией
- Контакты и история перенесены из `OverlayLayer` в `ControlsZone`
- Убраны modal/dialog semantics (`role="region"`, без scrim/backdrop)
- Header и window controls не перекрываются на macOS/Linux/Windows
- Обновлены регрессионные тесты layering и panel chrome

## Зачем
Пользовательский UX: контакты/история как панели над dialpad, а не полноэкранные модалки.

## Результат
`npm run test` — 1619 passed, 1 skipped; `lint`, `typecheck`, `ui:catalog` — OK.
