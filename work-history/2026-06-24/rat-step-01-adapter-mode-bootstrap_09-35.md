# RAT Step 01 — Adapter Mode Bootstrap

**Дата:** 2026-06-24 09:35
**Статус:** выполнено
**Коммит:** —

## Где
- `src/infrastructure/bootstrap/adapterMode.ts`
- `src/infrastructure/bootstrap/createMockAccountBootstrap.ts`
- `src/infrastructure/bootstrap/createRealAccountBootstrap.ts`
- `src/infrastructure/bootstrap/createSoftphoneComposition.ts`
- `src/infrastructure/bootstrap/createAccountBootstrap.ts` (alias → mock)
- `src/renderer/bootstrap/readBootstrapConfig.ts`
- `src/renderer/hooks/useAccountBootstrap.ts`
- `src/infrastructure/index.ts`
- `docs/softphone/real-integration/PROGRESS.md`

## Что
- Добавлен `AdapterMode` и `resolveAdapterMode` (URL > env > mock, invalid → mock)
- Тело `createAccountBootstrap` вынесено в `createMockAccountBootstrap`
- `createRealAccountBootstrap` — typed stub `RealAdapterBootstrapNotReadyError`
- `createSoftphoneComposition` — единый dispatcher mock|real
- `createAccountBootstrap` сохранён как backward-compat alias на mock
- Renderer: `readBootstrapConfig` экспортирует `adapterMode`, hook использует composition
- Unit-тесты: `adapterMode.test.ts`, `createSoftphoneComposition.test.ts` (+8)

## Зачем
Инфраструктурный шаг F-000: выбор mock/real адаптеров без дублирования facades и без изменений Domain/Use Cases.

## Результат
- `npm run test` — 496 passed (baseline 488 + 8)
- `npm run lint` — ok
- `npm run typecheck` — ok
- `?adapters=real` → stub error в UI без crash (через catch в `useAccountBootstrap`)
