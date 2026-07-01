# Fix gh release create --attach

**Дата:** 2026-07-01 17:25
**Статус:** выполнено
**Коммит:** —

## Где
- `scripts/migrate-distribution-releases.mjs`

## Что
- `gh release create` — файлы позиционными аргументами вместо несуществующего `--attach`

## Зачем
Migrate workflow падал на Ubuntu Actions gh CLI.

## Результат
Перезапустить Migrate distribution releases на `main`.
