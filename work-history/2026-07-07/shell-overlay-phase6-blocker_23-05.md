# Shell Navigation Phase 6 overlay blocker

**Дата:** 2026-07-07 23:05
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/shell/ShellOverlaySheet.tsx`
- `src/renderer/components/shell/ShellOverlaySheet.module.css`
- `src/renderer/components/settings/SettingsFullscreenOverlay.module.css`
- `src/renderer/styles/tokens.css`
- `src/renderer/shells/history/HistoryShellRoutePanel.tsx`
- `src/renderer/hooks/useCallHistoryActions.ts`
- `src/renderer/navigation/shellOverlayIncomingCall.test.tsx`
- `docs/softphone/handoffs/Shell-Navigation-Phase6-Smoke-Checklist.md`

## Что
- Sidebar overlays (contacts/history): non-blocking backdrop, `pointer-events` только на панели — входящий звонок в ContextZone кликабелен
- Settings остаётся blocking modal (`--z-shell-modal-overlay`) — правило задокументировано
- Redial из истории: `goToDialpad` только при успехе; ошибка через toast `history.error.redialFailed`
- Регрессионные тесты layering + redial notification
- i18n `history.error.redialFailed` (ru/en/fr/de/bg)

## Зачем
Закрыть Phase 6 blocker: входящий звонок должен оставаться видимым и actionable при открытых contacts/history sidebar.

## Результат
`npm run test`, `lint`, `typecheck`, `i18n:check`, `ui:catalog` — OK.
