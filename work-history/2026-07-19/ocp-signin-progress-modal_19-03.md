# OCP sign-in progress modal

**Дата:** 2026-07-19 19:03
**Статус:** выполнено
**Коммит:** `d3114b0`

## Где
- `src/application/projections/settings/authorizationProgressProjection.ts`
- `src/application/projections/settings/deriveOcpSignInProgressView.ts`
- `src/application/services/integration/OcpBackedSignInOrchestrationService.ts`
- `src/application/facades/AccountBootstrapFacade.ts` (`cancelOcpSignInAttempt`)
- `src/renderer/components/account/OcpSignInProgress.tsx`
- `src/renderer/hooks/useAccountActions.ts`
- `src/renderer/components/ui/dialog/Dialog.tsx` (`overlayClassName`)
- i18n `account.authProgress.*` (ru/en/fr/de/bg)
- `docs/softphone/Feature-Registry.md` (F-028)

## Что
- Модалка OCP-входа с blur-scrim, общим и поэтапным Progress
- Заполнение бара этапа синхронизировано с `OCP_SIGN_IN_STAGE_TIMEOUT_MS` + `stageStartedAtMs`
- Зелёный complete / красный failed + IconTooltip с причиной
- Footer: «Отключиться» → idle (`cancelOcpSignInAttempt`), «Переподключиться» при ошибке
- Live progress из Zustand OCP projection; operator-friendly stage copy
- Pure derive + unit/component tests

## Зачем
- Сделать длинный OCP→SIP pipeline понятным оператору и управляемым (cancel/reconnect) без поломки dual FSM / Account ownership.

## Результат
- Targeted tests: authorizationProgress / deriveOcpSignInProgressView / OcpSignInProgress / useAccountActions / AccountPanel — green
- `tsc` web+node — green; eslint touched files — green
- Version bump отложен на `/release` (CHANGELOG Unreleased обновлён)
