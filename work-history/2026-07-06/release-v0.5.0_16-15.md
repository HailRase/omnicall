# Release v0.5.0

**Дата:** 2026-07-06 16:15
**Статус:** выполнено
**Коммит:** pending tag push

## Где
- `package.json`, `CHANGELOG.md`, `distribution/CHANGELOG.md`, `distribution/update-manifest.json`
- `docs/softphone/STATUS.md`, manifest copies

## Что
- SemVer MINOR `0.4.0` → `0.5.0` (F-016 shell lifecycle controls)
- Internal + public CHANGELOG, manifest sync
- Tag `v0.5.0` → CI release.yml → axatalk-releases

## Зачем
Distribution release cut после merge F-016 shell UX в main.

## Результат
- `npm run release:preflight` — PASS (до feature commit)
- Feature commit `5f88d89` pushed to `origin/main`
- Release commit + tag `v0.5.0` — см. git log
