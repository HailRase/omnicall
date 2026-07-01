# Publish 403 — API instead of softprops

**Дата:** 2026-07-01 18:20
**Статус:** выполнено
**Коммит:** —

## Где
- `scripts/publish-distribution-release.mjs`
- `.github/workflows/release.yml`

## Что
- softprops/action-gh-release игнорировал PAT, использовал github.token (403 cross-repo)
- Publish через GitHub REST API + AXATALK_RELEASES_TOKEN (как migrate)

## Зачем
Release #21: build OK, publish 403 Resource not accessible by integration.

## Результат
Новый Release run по v0.0.2; или Re-run failed jobs после merge.
