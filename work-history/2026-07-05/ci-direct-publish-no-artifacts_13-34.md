# CI: direct publish без GitHub Artifacts

**Дата:** 2026-07-05 13:34
**Статус:** выполнено
**Коммит:** (см. git log)

## Где
- `.github/workflows/release.yml`
- `scripts/github-distribution-api.mjs`, `scripts/publish-distribution-release.mjs`
- guides (Release/CI docs)

## Что
- Убраны `upload-artifact` / `download-artifact` из Release workflow
- Каждый matrix job публикует установщики напрямую в axatalk-releases через API
- `ensureReleaseId` — race-safe создание Release
- Job `finalize-distribution` только sync manifest
- Тег `v0.1.0` пересоздан

## Зачем
Quota Artifacts исчерпана; даже 2 файла/job не загружались. Direct upload не использует Artifacts storage.

## Результат
- Release workflow quota-independent для tag push
- Рекомендация: удалить старые Artifacts в GitHub UI для других workflow
