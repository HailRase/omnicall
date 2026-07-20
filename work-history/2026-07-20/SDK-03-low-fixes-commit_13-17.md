# SDK-03 — Low fixes + commit

**Дата:** 2026-07-20 13:17
**Статус:** выполнено
**Коммит:** (см. git log после commit)

## Где
- `axatalk-sdk/packages/sdk/src/internal/request-correlator.ts`
- `axatalk-sdk/packages/sdk/tsconfig.json`
- `axatalk-sdk/scripts/package-check.mjs`
- `axatalk-sdk/evidence/SDK-03-transport-state-machine.md`

## Что
- `FakeTransport` / `test-helpers` исключены из production `dist` и forbidden в `package:check`
- Mutation ledger заменён на payload-free `mutationSendCount`
- Усилен diagnostics redaction test (secret/phone в body)
- Коммит всех текущих изменений репозитория по запросу

## Зачем
Закрыть Low follow-ups из `/sdk-review` PASS для SDK-03 и зафиксировать работу в git.

## Результат
- `npx vitest run packages/sdk/src` — PASS (18)
- `npm run lint` / `npm run preflight` — PASS (tarball без fake-transport)
