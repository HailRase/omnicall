# DI-11 Origin trust boot hydrate

**Дата:** 2026-07-21 16:04
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/integration/sdkOriginTrustMachineStore.ts`
- `src/adapters/integration/sdkGatewayOriginPolicy.ts`
- `src/main/sdk/registerSdkGateway.ts`
- `src/renderer/hooks/useSdkSettingsPanel.ts`
- `docs/softphone/adr/ADR-0018-sdk-origin-tofu-blacklist-activate-consent.md`
- `axatalk-sdk-integration/evidence/DI-11-origin-tofu-blacklist-activate.md`

## Что
- Machine-common SoT: `profiles/sdk-origin-trust.json` + one-shot migrate из profile silos
- Boot hydrate Origin trust в gateway до upgrade/discovery
- Env seed merge: persisted `denied` всегда побеждает `AXATALK_SDK_ALLOWED_ORIGINS`
- Тесты persist denied → rehydrate reject; denied + env seed → reject
- Docs/ADR §C.4 note; DI-11 status остаётся `review` (не `done`)

## Зачем
Закрыть Blocker `/sdk-review` FAIL: blacklist и matrix не применялись после cold start.

## Результат
- `npm run lint` PASS
- focused vitest 10 files / 42 passed
- `npm run typecheck` PASS; `npm run i18n:check` PASS
- SDK origin-policy tests 6 passed
- Запрошен повторный `/sdk-review` DI-11 only; SemVer `0.11.2`; F-011/P12 не закрыты
