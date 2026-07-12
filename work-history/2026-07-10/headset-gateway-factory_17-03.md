# T-015 Headset gateway factory (EXT-4/10)

**Дата:** 2026-07-10 17:03
**Статус:** выполнено
**Коммит:** —

## Где
- `src/infrastructure/bootstrap/createHeadsetGateway.ts`
- `src/adapters/headset/sdk/SdkHeadsetGatewayStub.ts`
- `src/infrastructure/bootstrap/createRealAccountBootstrap.ts`
- `src/infrastructure/bootstrap/createMockAccountBootstrap.ts`

## Что
- Добавлен `createHeadsetGateway(transport)` — `webhid` | `mock` | `sdk-stub`
- Real bootstrap → `createHeadsetGateway("webhid")`; mock → `"mock"`
- `SdkHeadsetGatewayStub` (EXT-10): `isSupported=false`, connect/send → `not_implemented`
- Unit tests на типы factory и stub

## Зачем
- DI-хук для будущего SDK-адаптера без hardcode `new WebHidHeadsetAdapter()` в bootstrap

## Результат
- Regression gate green: 104 tests (golden + factory + bootstrap), typecheck, lint
- Zero behavior change в production Web HID path
- Next: T-016 / EXT-5–8 policies
