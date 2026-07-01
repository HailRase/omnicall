# Release cut v0.0.2

**Дата:** 2026-07-01 16:38
**Статус:** выполнено
**Коммит:** `055d3e1`

## Где
- `package.json` → `0.0.2`
- `CHANGELOG.md`, manifest JSON
- `docs/softphone/User-Guide-RU.md`
- tag `v0.0.2` → CI Release workflow

## Что
- Release cut: preflight green, manifest sync, commit, push `main`, tag `v0.0.2`
- Включены все накопленные изменения: CI split, release automation, docs
- Добавлено руководство пользователя `User-Guide-RU.md`
- Обновлён `install-instruction.md` (релиз через тег, ссылка на Releases)

## Зачем
Первый автоматический release cut: CI публикует installers на GitHub Release.

## Результат
- `git push origin main` + `git push origin v0.0.2` — OK
- Проверить: Actions Release workflow, Release assets, raw manifest `latestVersion: 0.0.2`
