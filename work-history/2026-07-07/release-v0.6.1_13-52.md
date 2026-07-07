# Release v0.6.1

**Дата:** 2026-07-07 13:52
**Статус:** выполнено
**Коммит:** —

## Где
- `package.json`, `CHANGELOG.md`, `distribution/CHANGELOG.md`
- `distribution/update-manifest.json`
- `docs/softphone/STATUS.md`

## Что
- Commit `aba461a`: fix delete profile AlertDialog z-index + text buttons
- Merge `origin/main` — already up to date
- SemVer PATCH: `0.6.0` → `0.6.1`
- Tag `v0.6.1`, push `main` + tag

## Зачем
Hotfix: диалог удаления профиля не отображался поверх fullscreen-настроек.

## Результат
- `npm run release:preflight` — OK (1493 tests)
- `npm run release:sync-manifest` — OK
- Push: `origin/main`, `origin/v0.6.1`
