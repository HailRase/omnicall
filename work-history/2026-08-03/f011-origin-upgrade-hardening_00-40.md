# F-011 Origin upgrade hardening

**Дата:** 2026-08-03 00:40
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/integration/sdkGatewayOriginPolicy.ts`
- `src/adapters/integration/LocalWsServerAdapter.auth.test.ts`
- `omnicall-kit-integration/sdk-production-readiness/`

## Что
- Закрыт upgrade для unknown, malformed, missing и неразрешённых Origin.
- Allowlist принимает только точные HTTP(S) Origin без wildcard или path.
- Добавлены регрессии hostile, suffix, subdomain и malformed Origin.
- Исправлен DI-10 harness: ожидаемый socket error теперь фиксируется как исход проверки.
- F-011/WU-07 оставлены в состоянии gate fail.

## Зачем
- DI-10 выявил обход Origin admission до pairing.

## Результат
- Focused Vitest: 2 файла, 16 тестов PASS; `release:preflight`: 3108 passed / 1 skipped; `git diff --check` PASS.
- Packaged DI-10: 5/5 PASS; Edge smoke: 2/2 PASS; app, browser profile и listener `17341` очищены.
