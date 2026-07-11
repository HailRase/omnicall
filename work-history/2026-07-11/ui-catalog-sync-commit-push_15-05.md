# UI catalog sync — commit and push

**Дата:** 2026-07-11 15:05
**Статус:** выполнено
**Коммит:** `20c44af`

## Где
- `docs/softphone/UI-Component-Catalog.md`

## Что
- Синхронизирован UI-Component-Catalog после изменений `SettingsHeadsetPanel` и `Dialpad`
- Добавлены testid для headset panel (capabilities, hints, device-select)
- Добавлен registry tag `F-013` для `Dialpad`
- Закоммичено и запушено в `feature/real-adapters`

## Зачем
Закрыть blocker preflight: `npm run ui:catalog:check` требовал актуальный каталог компонентов.

## Результат
- Commit `20c44af` → push `origin/feature/real-adapters` OK
- Working tree clean
