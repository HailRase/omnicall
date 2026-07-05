# Release cut v0.1.0

**Дата:** 2026-07-05 13:03
**Статус:** выполнено
**Коммит:** `f76f122` (tag `v0.1.0`)

## Где
- `CHANGELOG.md`, `docs/softphone/STATUS.md`
- `distribution/update-manifest.json`, `docs/softphone/release/update-manifest.json`
- `main` @ `f76f122`, tag `v0.1.0`

## Что
- `npm run release:preflight` — PASS
- CHANGELOG `[0.1.0]` с i18n, SIP recovery, startup update prompt
- `npm run release:sync-manifest` для 0.1.0
- Merge `feature/real-adapters` → `main`
- Push `main`, `feature/real-adapters`, tag `v0.1.0`

## Зачем
Публикация MINOR 0.1.0 с пользовательскими фичами и F-020 startup prompt.

## Результат
- Git push успешен; CI Release workflow запущен тегом `v0.1.0`
- Manifest на axatalk-releases обновится после зелёного publish job
- `gh` не авторизован локально — проверка Actions вручную в GitHub UI
