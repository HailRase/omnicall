# Audit fix + release v0.4.0

**Дата:** 2026-07-06 12:55
**Статус:** выполнено
**Коммит:** `0a14c85`, tag `v0.4.0`

## Где
- `docs/softphone/handoffs/P11-F024-Saved-Account-Profiles-Handoff.md`
- `docs/softphone/` (STATUS, TASK-QUEUE, Feature Registry, RAT docs)
- `CHANGELOG.md`, `distribution/CHANGELOG.md`, `package.json`, manifests

## Что
- Handoff: manual smoke отмечен verified 2026-07-06
- Закоммичены doc drift F-024 + RAT (`8c078b0`)
- Release cut **0.4.0** — F-024 saved SIP profiles (`0a14c85`)
- `npm run release:preflight` PASS; `release:sync-manifest` обновил manifest JSON
- Push `main` + tag `v0.4.0` на origin

## Зачем
Закрыть High/Low из `/audit`: docs в git, MINOR release для F-024.

## Результат
- `npm run release:preflight` — green (1274 tests)
- `git push origin main` + `git push origin v0.4.0` — успех
- CI `release.yml` должен опубликовать installers на axatalk-releases
