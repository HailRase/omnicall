# SDK window.show bring-to-front

**Дата:** 2026-07-22 12:00
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/integration/sdkGatewayWindowHandler.ts`
- `src/adapters/integration/sdkGatewayWindowHandler.test.ts`
- `docs/softphone/adr/ADR-0013-sdk-window-policy-and-signin.md`
- `axatalk-sdk-integration/TEST-MATRIX.md`, `SMOKE-CHECKLIST.md`, `WORK-UNITS.md`, `evidence/DI-05-...`
- `axatalk-sdk/docs/SECURITY.md`, `docs/guide/api-reference.md`
- `docs/softphone/Feature-Registry.md`, `CHANGELOG.md` (Unreleased)

## Что
- Усилен native `window:show`: restore → show → focus → moveTop → краткий always-on-top pulse с восстановлением прежнего pin
- Добавлены unit-тесты handler (minimized, occluded, rate limit, pin restore, not_ready)
- Согласованы ADR-0013, TEST-MATRIX, SMOKE, DI-05 evidence, SECURITY, Feature Registry
- Capability / Origin-matrix / rate limit не менялись

## Зачем
- Исправить Windows-поведение: после SDK `window.show` софтфон мигал в taskbar вместо появления поверх других приложений

## Результат
- focused vitest: 33 passed (window handler + product + route + multiOrigin)
- eslint на touched TS: ок
- Версия не bump (фикс в Unreleased; релизный cut отдельно)
