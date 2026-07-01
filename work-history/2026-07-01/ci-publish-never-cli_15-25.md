# CI --publish never for electron-builder

**Дата:** 2026-07-01 15:25
**Статус:** выполнено
**Коммит:** —

## Где
- `package.json` build:win/mac/all
- `scripts/build-linux.mjs`
- `docs/softphone/GitHub-Releases-Update-Guide.md`

## Что
- `--publish never` во все вызовы electron-builder
- Причина: `publish: null` не помогает — в Actions есть `GITHUB_TOKEN`, builder всё равно публикует

## Зачем
CI должен только собирать артефакты без GH_TOKEN / auto-upload.

## Результат
- Push в main; Re-run Build installers
