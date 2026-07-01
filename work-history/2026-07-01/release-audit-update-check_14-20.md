# Release & update check audit (F-020)

**Дата:** 2026-07-01 14:20
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/release/update-manifest.json`
- `docs/softphone/examples/update-manifest.json`
- `docs/softphone/GitHub-Releases-Update-Guide.md`
- `.cursor/rules/version-release.mdc`
- `.github/workflows/release.yml`

## Что
- Discovery: default branch `main`, raw manifest 200, тег Release `v0.0.1`, win asset OK, mac/linux 404
- Убраны `platforms.darwin` и `platforms.linux` из manifest (нет assets на Release)
- Guide: CI/workflow_dispatch, правило «platforms только для загруженных файлов», title релиза
- `version-release.mdc`: `master` → `main`
- Комментарии в `release.yml` про ручную загрузку артефактов

## Зачем
Привести цепочку F-019/F-020 к production: manifest без битых ссылок, документация и ветка согласованы с GitHub.

## Результат
- `typecheck`, `lint`, `registry:check` — OK
- `test` — 1 fail (`useSettingsActions.test.ts`, setNativeTheme mock); CI run #1 тоже failed на tests
- Локальный `dist/win/Axatalk-0.0.1-win-x64.exe` с baked `main` manifest URL — OK, пересборка не требуется
- Осталось пользователю: push manifest, CI re-run, загрузить mac/linux в Release, поправить title релиза
