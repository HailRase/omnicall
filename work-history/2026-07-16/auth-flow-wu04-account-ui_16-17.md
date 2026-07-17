# Auth Flow WU-04 — Account UI

**Дата:** 2026-07-16 16:17
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/account/AccountPanel.tsx`
- `src/renderer/hooks/useAccountActions.ts`, `accountActionsHelpers.ts`
- `src/renderer/components/settings/panels/SettingsAccountPanel.tsx`
- `src/renderer/shells/SoftphoneReadyShell.tsx`, `AuthAccountShell.tsx`
- `auth-flow/auth-flow-refactoring.md`, `docs/softphone/handoffs/P11-Auth-Flow-Refactoring-Handoff.md`

## Что
- Добавлены вкладки режимов SIP only / OCP module и OCP-поля на `InputGroup`
- Хук переведён на `signInAccount` / `getAccountSignInViewModel` / `dispatchAccountRecoveryAction`
- Удалены Account logout, switch-confirmation modal и generic retry; recovery только state-specific
- Login disabled при SIP-ready с `account.signIn.disabled.logoutFirst`; i18n ru/en/fr/de/bg
- Обновлены Feature Registry, STATUS, TASK-QUEUE, UI catalog, I18N-Coverage, Legacy LF-077

## Зачем
- Закрыть WU-04 Auth Flow: единый Account sign-in surface без смены аккаунта из формы

## Результат
- `npm run test` — 2148 passed / 1 skipped
- `npm run lint`, `typecheck`, `i18n:check`, `ui:catalog` — green
- Следующий шаг: `/preflight` → `/review`, затем WU-05
