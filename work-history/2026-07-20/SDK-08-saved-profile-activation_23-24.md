# SDK-08 — Privileged Saved-Profile Activation

**Дата:** 2026-07-20 23:31
**Статус:** выполнено
**Коммит:** `4990c02`

## Где
- `axatalk-sdk/packages/sdk/src/internal/account-activate-wire.ts`
- `axatalk-sdk/packages/sdk/src/internal/account-activate-commands.ts`
- `axatalk-sdk/packages/sdk/src/public/axatalk-client*.ts`
- `axatalk-sdk/packages/sdk/src/public/axatalk-client.activate.test.ts`
- `axatalk-sdk/tests/browser/axatalk-client-activate.browser.test.ts`
- `axatalk-sdk/evidence/SDK-08-saved-profile-activation.md`
- `axatalk-sdk/docs/WORK-UNITS.md`

## Что
- Namespaced API `client.account.activateProfile({ profileRef, expectedRevision })`
- Privilege fortress: `account.activate` только server-granted; sanitize strip остаётся абсолютным
- Fail-closed матрица + reconnect non-replay + disconnect non-tear
- `/sdk-review` PASS; Low: mid-flight `disconnect()` activate reject (same-day)
- F-011 остаётся `in progress`; DI-10 blocked на SDK-09

## Зачем
- Верный protocol consumer DI-08 для привилегированной активации saved-profile без секретов и без pairing escalate.

## Результат
- SDK-08 → `done`; post-fix: sdk src **106**, workspace **114**, types **6**, browser **7**, api **47**, desktop oracle **9**
- Next: `/sdk-project` SDK-09 only
