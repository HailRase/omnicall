# Fix main broker resolve sdkActivateTimeouts

**Дата:** 2026-07-23 14:10
**Статус:** выполнено
**Коммит:** —

## Где
- `src/shared/integration/sdkActivateTimeouts.ts`
- `src/application/integration/sdkActivateTimeouts.ts` (re-export)
- `src/adapters/integration/MainToRendererBroker.ts`

## Что
- Перенёс SSoT таймаутов activate в `@shared` (main-safe aliases)
- Брокер импортирует `@shared/...`, не `@application/...`
- Application сохраняет re-export для существующих импортов

## Зачем
- Vite main SSR не резолвил `@application` → падение сборки Electron

## Результат
- Focused tests PASS (shared + app re-export + MainToRendererBroker)
