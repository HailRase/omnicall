# Release v0.6.0

**Дата:** 2026-07-07 13:35
**Статус:** выполнено
**Коммит:** `9cd4c30`

## Где
- `package.json`, `CHANGELOG.md`, `distribution/CHANGELOG.md`
- `distribution/update-manifest.json`, `docs/softphone/release/update-manifest.json`
- `docs/softphone/STATUS.md`

## Что
- Merge `feature/real-adapters` → `main` (fast-forward, 11 коммитов)
- SemVer MINOR: `0.5.1` → `0.6.0`
- Preflight green (1493 tests); fix `useActionNotifications` descriptor types
- Tag `v0.6.0`, push `main` + tag

## Зачем
Выпустить UI Kit migration, болгарскую локаль, удаление профиля, Sonner notifications.

## Результат
- `npm run release:preflight` — OK (после lint/typecheck fix)
- `npm run release:sync-manifest` — OK
- Push: `origin/main`, `origin/v0.6.0`
- CI Release workflow: мониторить Actions
