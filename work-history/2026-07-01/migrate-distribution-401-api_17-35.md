# Migrate 401 axatalk-releases — GitHub API

**Дата:** 2026-07-01 17:35
**Статус:** выполнено
**Коммит:** —

## Где
- `scripts/github-distribution-api.mjs`
- `scripts/migrate-distribution-releases.mjs`
- `.github/workflows/migrate-distribution.yml`
- `guides/Distribution-Migration-Checklist.md`

## Что
- Создание release и upload через GitHub REST API (Bearer), не `gh release create`
- Preflight `verifyDistributionToken` в workflow и в начале скрипта
- Trim токенов; `gh` только для скачивания из source

## Зачем
401 при записи в `axatalk-releases` из-за конфликта/gh CLI и невалидного PAT.

## Результат
Перезапустить Migrate на `main`. При 401 на шаге Verify — пересоздать `AXATALK_RELEASES_TOKEN` (Contents read+write на axatalk-releases).
