# DI-04 review High/Low remediation

**Дата:** 2026-07-20 15:09
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/integration/sdkGatewayPopCrypto.ts` (+ test)
- `src/adapters/integration/LocalWsServerAdapter.ts` / `localWsServerAdapterTypes.ts`
- `src/adapters/integration/sdkGatewayAuthChallenge.test.ts`
- `src/adapters/integration/LocalWsServerAdapter.auth.test.ts` / `.test.ts`
- evidence / STATUS / WORK-UNITS / P12 handoff

## Что
- Закреплён PoP SPKI на `prime256v1`; отклоняются P-384 / secp256k1
- Enabled gateway без `SecretStoragePort` → `missing_secret_storage` (без InMemory default)
- Тесты: expired challenge, auth session TTL, missing secret storage
- Типы вынесены — `LocalWsServerAdapter.ts` ≤ 300 строк
- Документы DI-04 обновлены после `/sdk-review` PASS + remediation

## Зачем
Закрыть High/Low из `/sdk-review` DI-04 до старта DI-05 product path.

## Результат
Focused vitest (DI-04 set) зелёный; архитектурные границы сохранены (Domain free; gateway без Facade/Call Engine; Electron только в main registration).
