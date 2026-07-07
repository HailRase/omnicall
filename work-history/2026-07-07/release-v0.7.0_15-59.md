# Release v0.7.0

**Дата:** 2026-07-07 15:59
**Статус:** выполнено
**Коммит:** `7e5144c`

## Где
- `package.json`, `CHANGELOG.md`, `distribution/CHANGELOG.md`
- `distribution/update-manifest.json`, `docs/softphone/STATUS.md`
- Git tag `v0.7.0` на `main`

## Что
- Коммит `feat(ui,shell): macOS traffic lights…` + merge `origin/main` → `main`
- Push `feature/real-adapters` и `main`
- `npm run release:preflight` — OK
- SemVer MINOR: `0.6.1` → `0.7.0`
- `npm run release:sync-manifest`
- `chore(release): cut v0.7.0`, tag `v0.7.0`, push main + tag

## Зачем
Выпустить накопленные UX-изменения shell/settings/macOS после merge ветки в main.

## Результат
- `npm run release:preflight` — OK (~697 tests)
- Tag: https://github.com/HailRase/softphone-electron/releases/tag/v0.7.0
- Actions: https://github.com/HailRase/softphone-electron/actions/workflows/release.yml
- Manifest (после CI): https://raw.githubusercontent.com/HailRase/axatalk-releases/main/update-manifest.json
- Distribution release: https://github.com/HailRase/axatalk-releases/releases
- `gh` CLI недоступен локально — статус CI проверить вручную в Actions
