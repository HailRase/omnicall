# CI disable electron-builder auto-publish

**Дата:** 2026-07-01 15:10
**Статус:** выполнено
**Коммит:** —

## Где
- `electron-builder.yml` — `publish: null`
- `.github/workflows/release.yml` — `EP_PUBLISH: never`
- `docs/softphone/GitHub-Releases-Update-Guide.md`

## Что
- Отключена implicit publish на CI (ошибка GH_TOKEN после успешной сборки)
- В guide: Linux `x86_64`/`amd64` имена, troubleshooting GH_TOKEN

## Зачем
Workflow должен только собирать артефакты; Release загружается вручную.

## Результат
- Push в main; пользователю: Re-run Build installers workflow
