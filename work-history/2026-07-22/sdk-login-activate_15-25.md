# SDK login activate path

**Дата:** 2026-07-22 15:25
**Статус:** выполнено
**Коммит:** —

## Где
- `axatalk-sdk/packages/protocol` — `login` (+ optional `mode`) вместо `profileRef`
- `src/application/integration/ExternalSdkAccountHandler.ts`, `createSdkAccountPortFromFacade.ts`
- `src/adapters/integration/sdkAccountActivateSession.ts`, `sdkGatewayActivateApproval.ts`
- `src/renderer/components/integration/SdkActivateProfileConsentModal.tsx`
- ADR-0013 / ADR-0016 / ADR-0018, Feature Registry, CHANGELOG, UX blueprint, UI catalog
- sdk-demo (вне репо) — login field

## Что
- Убран Settings temporary grant / opaque profileRef
- `account.activate` из Origin matrix + `sdk:permission-changed`
- Consent: activate / reauthorize / logout_required; SIP/OCP method picker
- Ошибки: `account_not_found`, `account_incomplete`, `authorization_canceled_by_user`, `logout_required`
- Same login + same clientId → alreadyAuthenticated без модалки

## Зачем
Один понятный путь авторизации SDK→Axatalk по логину без выдачи ref из Settings.

## Результат
- `npm run typecheck` PASS
- `npm run lint` PASS (softphone)
- `axatalk-sdk` lint PASS (исправлен `consistent-type-imports` в `origin-policy-errors.ts`)
- `npm run test` — **2570 passed / 1 skipped**
- `npm run i18n:check` PASS
