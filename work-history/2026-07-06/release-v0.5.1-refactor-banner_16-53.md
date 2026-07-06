# Release v0.5.1 — update banner refactor

**Дата:** 2026-07-06 16:53
**Статус:** выполнено
**Коммит:** `ae98c6e` / tag `v0.5.1`

## Где
- `package.json`, `CHANGELOG.md`, `distribution/CHANGELOG.md`, `distribution/update-manifest.json`
- `docs/softphone/STATUS.md`, manifest copies

## Что
- PATCH `0.5.0` → `0.5.1`
- F-020: floating overlay update banner вместо header strip
- Tag `v0.5.1`, push `main` + tag

## Зачем
Release cut после refactor banner UX.

## Результат
- `npm run release:preflight` — OK
- `npm run release:sync-manifest` — OK
