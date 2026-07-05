# Release cut v0.3.0

**Дата:** 2026-07-06 01:42
**Статус:** выполнено
**Коммит:** `b3a61a1`

## Где
- `package.json`, `CHANGELOG.md`, `distribution/CHANGELOG.md`, `distribution/update-manifest.json`
- `docs/softphone/STATUS.md`

## Что
- SemVer MINOR `0.2.0` → `0.3.0` (F-023 per-account local settings profiles)
- CHANGELOG (RU internal + EN public distribution)
- `npm run release:sync-manifest`
- Tag `v0.3.0`, push `main` + tag

## Зачем
Distribution release после F-023 и fix preflight (OCP campaign tests).

## Результат
- `npm run release:preflight`: green (1189 passed)
- CI Release workflow: ожидается после push tag
