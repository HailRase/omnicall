# F-011 gate verification

**Дата:** 2026-08-03 00:11
**Статус:** не выполнено
**Коммит:** —

## Где
- `omnicall-kit/packages/sdk`, `src/adapters/integration`, `src/application/integration`

## Что
- SDK owns and exports `SDK_VERSION`; caller-supplied `sdkVersion` was removed.
- Added fixed-loopback discovery validation, protocol type exports, API/type regression coverage.
- Activation cancellation now binds to Origin + clientId and rejects late auth completion.
- Kit preflight passed; the later desktop preflight run failed only because its IPC contract test needed the new Origin field.

## Зачем
- Finish remaining F-011 SDK DX and cancellation safety without claiming the open gate closed.

## Результат
- `omnicall-kit npm run preflight`: PASS; focused desktop tests: 28 PASS; `git diff --check`: PASS.
- `npm run release:preflight`: re-run required after the corrected `SdkBrokerContract` expectation; packaged E2E remains unrun.
