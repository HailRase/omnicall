# Release v0.7.1

**Дата:** 2026-07-07 17:30
**Статус:** выполнено
**Коммит:** `chore(release): cut v0.7.1`

## Где
- `package.json`, `CHANGELOG.md`, `distribution/CHANGELOG.md`, `distribution/update-manifest.json`
- `docs/softphone/STATUS.md`

## Что
- PATCH bump `0.7.0` → `0.7.1`
- CHANGELOG: F-016 settings-only resize, UI Kit number fields, platform icons
- `npm run release:sync-manifest`
- Tag `v0.7.1` pushed to `origin/main`

## Зачем
Distribution release после shell resize, settings number UI Kit, иконок macOS/Windows.

## Результат
- `npm run release:preflight` — ok (1519 passed, 1 skipped)
- Push: `origin/main` + `v0.7.1`
