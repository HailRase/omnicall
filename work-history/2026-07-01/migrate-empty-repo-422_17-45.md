# Migrate 422 empty axatalk-releases

**Дата:** 2026-07-01 17:45
**Статус:** выполнено
**Коммит:** —

## Где
- `scripts/push-distribution-repo.mjs`
- `scripts/migrate-distribution-releases.mjs`
- `guides/Distribution-Migration-Checklist.md`

## Что
- Push README+manifest до создания releases (GitHub требует коммит на main)
- `push-distribution-repo`: clone пустого repo, initial commit, `git push -u origin main`
- Экспорт `pushDistributionRepo`, CLI только при прямом запуске

## Зачем
HTTP 422 «Repository is empty» при `gh release create` / Releases API.

## Результат
Перезапустить Migrate distribution releases на `main`.
