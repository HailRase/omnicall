# DI-11 — lint + matrix-off coverage

**Дата:** 2026-07-21 15:49
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/integration/ExternalSdkAccountHandler.test.ts`
- `src/adapters/integration/sdkGatewayActivateApproval.ts`
- `src/adapters/integration/sdkGatewayActivateApproval.test.ts`
- `src/adapters/integration/sdkGatewaySessionDispatch.ts`
- `axatalk-sdk-integration/evidence/DI-11-origin-tofu-blacklist-activate.md`
- `axatalk-sdk-integration/WORK-UNITS.md`

## Что
- Сняты lint Blocker: sync `Promise.resolve` mocks + локальные `vi.fn` для expect (без unbound-method)
- Unit-тест: matrix `account.activate=false` → immediate `forbidden`+`permission_denied` без потребления grant
- `isOriginActivateAllowed` fail-closed на пустых caps (DI-08 harness остаётся через autoApprovePairing)
- Evidence / WORK-UNITS: status `review`, запрос повторного `/sdk-review`

## Зачем
Закрыть `/sdk-review` FAIL по lint и закрыть High по matrix-off / fail-closed без расширения scope DI-11.

## Результат
- `npm run lint` → PASS
- focused vitest → 13 passed
- `npm run typecheck` / `i18n:check` → PASS
- SemVer остаётся `0.11.2`; F-011/P12 не закрывались
