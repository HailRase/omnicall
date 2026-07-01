# Настройка axatalk-releases (public distribution)

**Дата:** 2026-07-01 17:05
**Статус:** выполнено (код); миграция — после секрета у пользователя
**Коммит:** —

## Где
- `scripts/distribution-config.mjs`, `sync-release-manifest.mjs`, `push-distribution-repo.mjs`, `migrate-distribution-releases.mjs`
- `distribution/README.md`, `distribution/update-manifest.json`
- `.github/workflows/release.yml`, `migrate-distribution.yml`
- `guides/Distribution-Migration-Checklist.md`
- `.env.production` → axatalk-releases manifest URL

## Что
- CI publish только в `HailRase/axatalk-releases` (installers + manifest push)
- Миграция тегов v0.0.1/v0.0.2 workflow + скрипт
- README для публичного репо (пользователи + агенты)
- Чеклист переноса, обновление guides/STATUS/AGENTS

## Зачем
Private source + public distribution: пользователи видят только установщики и manifest.

## Результат
- `npm run release:preflight` — green
- Пользователю: добавить `AXATALK_RELEASES_TOKEN`, Run workflow **Migrate distribution releases**, затем private softphone-electron, release 0.0.3
