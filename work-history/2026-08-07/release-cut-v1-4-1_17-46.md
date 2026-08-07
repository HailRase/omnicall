# Release cut v1.4.1

**Дата:** 2026-08-07 17:46
**Статус:** выполнено
**Коммит:** `770a0f91`

## Где
- `package.json`
- `CHANGELOG.md`, `distribution/CHANGELOG.md`
- `distribution/update-manifest.json` (+ docs copies)
- `docs/softphone/STATUS.md`

## Что
- PATCH bump `1.4.0` → `1.4.1`
- CHANGELOG: F-021 language-switch / SDK settings bootstrap race fix
- `npm run release:sync-manifest`
- Tag `v1.4.1` + push `main` + tag for CI release publish

## Зачем
- Bugfix distribution release for interface language switch loop

## Результат
- `npm run release:preflight` — green before cut
- Version / manifest / STATUS synced to 1.4.1
- CI Release run success: https://github.com/HailRase/omnicall/actions/runs/31189341617
- Distribution: https://github.com/HailRase/omnicall-releases/releases/tag/v1.4.1
- Live manifest `latestVersion`: `1.4.1`
