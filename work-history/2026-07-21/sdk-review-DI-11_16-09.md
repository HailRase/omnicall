# /sdk-review DI-11

**Дата:** 2026-07-21 16:09
**Статус:** выполнено
**Коммит:** —

## Где
- `axatalk-sdk-integration/WORK-UNITS.md` (DI-11 → `done`)
- `axatalk-sdk-integration/evidence/DI-11-origin-tofu-blacklist-activate.md`
- `docs/softphone/STATUS.md`, `Feature-Registry.md`, P12 handoff
- `src/adapters/integration/sdkOriginTrustMachineStore.ts`, `registerSdkGateway.ts`

## Что
- Независимый `/sdk-review` для DI-11: checklist ADR-0018, boot hydrate, machine-common store
- Prior Blocker (blacklist не гидрируется на старте) снят — denied-wins над env seed подтверждён тестами
- Gate **PASS**, Blocker нет; DI-11 закрыт (`done`); F-011/P12 не закрыты
- Зафиксированы High/Low (fail-open при corrupt store; SemVer; synthetic deny reply)

## Зачем
Закрыть DI-11 (ADR-0018 TOFU/blacklist/matrix/activate consent) перед остаточным DI-10 smoke.

## Результат
DI-11 `done`. Следующий юнит не стартован / DI-12 не изобретён.  
Проверки: focused vitest 10 files / 42 passed; SDK origin-policy 6 passed; `api:check` PASS; lint / typecheck / i18n PASS.
