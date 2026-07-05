# Release cut v0.2.0

**Дата:** 2026-07-06 00:18
**Статус:** выполнено
**Коммит:** `7c0563e`

## Где
- `package.json`, `CHANGELOG.md`, `distribution/CHANGELOG.md`, `distribution/update-manifest.json`
- `docs/softphone/STATUS.md`, `.github/workflows/release.yml`

## Что
- Версия 0.1.3 → 0.2.0 (MINOR: F-022 codec preferences)
- Changelog: F-022 + публичные release notes на axatalk-releases
- Manifest sync на v0.2.0
- Коммит `chore(release): cut v0.2.0`, push `main`, тег `v0.2.0`

## Зачем
Выпустить все изменения после v0.1.3: панель кодеков и автоматизация публичной документации дистрибуции.

## Результат
- `npm run release:preflight` — OK
- Push main + tag v0.2.0 — OK
- CI Release workflow запущен; installers и docs на axatalk-releases — дождаться зелёного run
- Backfill release notes v0.0.1–v0.1.3: выполнится в finalize job для v0.2.0; старые релизы — `npm run release:backfill-notes` при необходимости
