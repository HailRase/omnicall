# Release v0.8.0

**Дата:** 2026-07-08 01:05
**Статус:** выполнено
**Коммит:** (release commit hash after push)

## Где
- `package.json`, `CHANGELOG.md`, `distribution/CHANGELOG.md`, `distribution/update-manifest.json`
- `docs/softphone/STATUS.md`

## Что
- Merge `feature/real-adapters` → `main` (fast-forward)
- SemVer MINOR: `0.7.1` → `0.8.0` (F-013, F-025, shell navigation)
- `npm run release:preflight` — OK
- `npm run release:sync-manifest`
- Tag `v0.8.0`, push `main` + tag

## Зачем
Выпуск user-visible релиза с контактами, историей звонков и shell navigation.

## Результат
Preflight green; CI Release workflow triggered on tag push.
