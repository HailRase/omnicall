# Commit and push i18n gap closure

**Дата:** 2026-07-04 16:34
**Статус:** выполнено
**Коммит:** `d3c4238`

## Где
- `src/renderer/i18n/`, `src/renderer/components/`, `src/renderer/shells/`, `src/renderer/helpers/`
- `src/application/projections/deriveSipSystemStateShell.ts`
- `scripts/i18n-*`, `scripts/merge-i18n-*`, `scripts/check-i18n-hardcoded.mjs`
- `docs/softphone/I18N-Coverage.md`, `docs/softphone/UI-Component-Catalog.md`

## Что
- Закоммичены все незакоммиченные изменения i18n-миграции (32 файла)
- Миграция System State, Dialpad, shells, connection recovery helpers
- Скрипты locale overrides и full-repo i18n hardcode scan
- Синхронизирован UI Component Catalog
- Push в `origin/feature/real-adapters`

## Зачем
Зафиксировать завершение i18n gap closure и отправить на remote для review.

## Результат
- Коммит `d3c4238` на ветке `feature/real-adapters`
- Push успешен: `8fd3e07..d3c4238`
