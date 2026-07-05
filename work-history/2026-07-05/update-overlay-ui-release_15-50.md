# Update overlay UI + release v0.1.2

**Дата:** 2026-07-05 15:50
**Статус:** выполнено
**Коммит:** `d50edb0`

## Где
- `src/renderer/components/updates/UpdateAvailableBanner.*`
- `src/renderer/hooks/useAppUpdate.ts`
- `src/renderer/components/icons/iconCatalog.ts`
- `src/renderer/i18n/messages.ts`
- `package.json`, `CHANGELOG.md`, manifest copies

## Что
- Баннер обновления заменён на центрированный modal overlay со scrim, иконкой Download, badge версии и анимацией
- «Скачать» скрывает overlay и сохраняет dismissed version (как «Позже»)
- Добавлен semantic icon `updates.available`, i18n `updates.prompt.title/description` (ru/en/fr/de)
- Обновлены Feature Registry F-020, Icon Registry, тесты
- Release cut `0.1.2`: CHANGELOG, manifest sync, tag `v0.1.2`

## Зачем
Улучшить UX предложения об обновлении и закрыть overlay после перехода к загрузке; выпустить PATCH с видимыми правками.

## Результат
- `npm run release:preflight` — OK (1054 tests)
- `npm run i18n:check` — OK
- Push `main` + tag `v0.1.2` → origin (CI release.yml соберёт установщики)
