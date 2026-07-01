# CI electron-builder token strip wrapper

**Дата:** 2026-07-01 15:45
**Статус:** выполнено
**Коммит:** `cd933a6`

## Где
- `scripts/run-electron-builder.mjs` (new)
- `package.json`, `scripts/build-linux.mjs`
- `.github/workflows/release.yml`, `electron-builder.yml`

## Что
- Wrapper: `--publish never` + очистка `GITHUB_TOKEN`/`GH_TOKEN`
- Workflow build step: пустые токены
- `generateUpdatesFilesForAllChannels: false`
- Guide: не Re-run, а новый Run workflow

## Зачем
На Actions `GITHUB_TOKEN` включает implicit publish; `--publish never` одного недостаточно.

## Результат
- Push main; пользователю: **Run workflow** (не Re-run) на commit `cd933a6+`
