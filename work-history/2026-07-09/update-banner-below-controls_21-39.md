# Update banner below window controls

**Дата:** 2026-07-09 21:39
**Статус:** выполнено
**Коммит:** `39afae2`

## Где
- `src/renderer/components/updates/UpdateAvailableBanner.module.css`
- `src/renderer/components/updates/UpdateAvailableBanner.tsx`
- `src/renderer/components/updates/UpdateAvailableBanner.test.tsx`
- `docs/softphone/Feature-Registry.md` (F-020)
- `docs/softphone/UI-Component-Catalog.md`

## Что
- Якорь баннера обновления сдвинут на `top: var(--incoming-call-banner-top)` — тот же inset, что у Incoming Call Overlay
- Добавлен `data-testid="update-available-banner-anchor"` и тест на класс якоря
- Обновлены acceptance F-020 и UI catalog

## Зачем
- Баннер обновления не должен перекрывать shell window controls

## Результат
- `npm run ui:catalog` — OK
- `npm run test` — 1586 passed, 1 skipped
- `npm run lint` / `npm run typecheck` — green
