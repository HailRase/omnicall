# Fix release.yml Actions parse failures

**Дата:** 2026-07-01 18:00
**Статус:** выполнено (ожидание CI)
**Коммит:** `e8af7a5`

## Где
- `.github/workflows/release.yml`

## Что
- Убраны битые `\r\r\n` (GitHub показывал Failure с 0 jobs на push main)
- `target_commitish: main`, `DISTRIBUTION_GITHUB_TOKEN` в publish
- Тег `v0.0.2` → `e8af7a5`, force-push для Release CI

## Зачем
Run #14: build OK, publish failed; runs #15–17 — мгновенный Failure без jobs.

## Результат
Дождаться зелёного Release → v0.0.2 на axatalk-releases → private repo.
