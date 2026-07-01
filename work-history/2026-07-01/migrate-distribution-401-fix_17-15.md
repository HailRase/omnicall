# Fix migrate distribution 401

**Дата:** 2026-07-01 17:15
**Статус:** выполнено
**Коммит:** `e5cc91b`

## Где
- `scripts/migrate-distribution-releases.mjs`
- `.github/workflows/migrate-distribution.yml`
- `guides/Distribution-Migration-Checklist.md`

## Что
- Разделены токены: SOURCE (read softphone-electron) и DISTRIBUTION (write axatalk-releases)
- CI: SOURCE=`github.token`, DISTRIBUTION=`AXATALK_RELEASES_TOKEN`

## Зачем
401 Bad credentials — PAT axatalk-releases не может читать releases source repo.

## Результат
Перезапустить workflow Migrate distribution releases на `main`.
