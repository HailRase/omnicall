# F-020: persist update banner dismiss across restarts

**Дата:** 2026-07-05 16:45
**Статус:** выполнено
**Коммит:** —

## Где
- `src/ports/updates/UpdateBannerDismissStore.ts`
- `src/adapters/updates/LocalStorageUpdateBannerDismissStore.ts`
- `src/renderer/hooks/useAppUpdate.ts`, `useAppUpdate.test.ts`
- `package.json`, `CHANGELOG.md`, manifest copies, `Feature-Registry.md`

## Что
- Добавлен порт `UpdateBannerDismissStore` и адаптер `LocalStorageUpdateBannerDismissStore`
- «Позже» / «Скачать» пишут dismissed version в `localStorage` (ключ `axatalk.dismissed-update-banner-version`)
- `useAppUpdate` учитывает dismissed из `UserSettings` или `localStorage` при показе баннера
- Тест remount после dismiss без UserSettings; release `v0.1.3`

## Зачем
После «Позже» баннер снова появлялся при следующем входе: `UserSettings` хранились только в `InMemorySettingsRepository` и терялись при перезапуске.

## Результат
- `npm run release:preflight` — OK (1058 tests)
- `npm run release:sync-manifest` — OK (`latestVersion: 0.1.3`)
- Tag/push `v0.1.3` — по запросу пользователя
