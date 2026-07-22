# Global OCP progress overlay

**Дата:** 2026-07-22 16:08
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `src/renderer/shells/AuthAccountShell.tsx`
- `src/renderer/components/account/OcpSignInProgress.tsx` (+ CSS density)
- `src/renderer/hooks/useAccountActions.ts`
- `src/application/projections/settings/shouldOpenOcpSignInProgressModal.ts`
- Docs: Feature-Registry F-028, UI-Architecture, UX-UI-Design-Blueprint, CHANGELOG, STATUS

## Что
- Модалка прогресса OCP вынесена из `AccountPanel` на shell (видно на dialpad/contacts/history/settings)
- Auto-open по live `authorizationProgress` (ручной Login + SDK activate)
- Density `compact` / `comfortable` под размер окна
- Disconnect / Reconnect API без изменений (`cancelOcpSignInAttempt` / `recoverOcpSignInFromModal`)

## Зачем
- Чтобы при SDK/фоновом OCP-входе оператор видел этапы и мог переподключиться, даже без открытых Settings.

## Результат
- Targeted tests: 59 passed (`shouldOpen*`, `OcpSignInProgress`, `useAccountActions`, Account/Settings panels)
- `tsc -p tsconfig.web.json` — green; `npm run ui:catalog` — regenerated
