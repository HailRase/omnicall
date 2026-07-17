# OCP: SIP-профиль из entity:creds

**Дата:** 2026-07-17 16:58
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/renderer/hooks/accountActionsHelpers.ts`
- `src/application/facades/AccountBootstrapFacade.accountSignIn.test.ts`
- `src/renderer/hooks/accountActionsHelpers.test.ts`
- `docs/softphone/Feature-Registry.md`, `TASK-QUEUE.md`, `STATUS.md`, `Legacy-Feature-Coverage.md`
- `ocp-integration/OCP-IMPLEMENTATION-PLAN.md`

## Что
- После OCP SIP-ready `persistOcpDerivedSipArtifacts` сохраняет SIP `domain` / `server` / password из активного `SipAccount` (payload `entity:creds`), а `ocpDomain` — отдельно как OCP proxy host
- Provisional draft с OCP Domain в SIP-полях мигрирует секреты и удаляется
- Saved-profile path больше не перезаписывает SIP identity OCP Domain
- `buildAccountSignInCommand` сохраняет флаг `rememberPassword` до прихода creds
- Регрессионный тест на реальном сценарии provisional OCP host → creds PBX

## Зачем
При авторизации через OCP Module в сохранённый SIP-профиль ошибочно попадали OCP Domain/server вместо данных из socket `creds`.

## Результат
- Баг подтверждён и исправлен (ADR-AF-001 migration)
- `npm run test && npm run lint && npm run typecheck` — green (2250 passed / 1 skipped)
- T-044 / F-024,F-028 закрыт
