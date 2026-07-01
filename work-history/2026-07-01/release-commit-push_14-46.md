# Release commit and push

**Дата:** 2026-07-01 14:46
**Статус:** выполнено
**Коммит:** `88d205a`

## Где
- manifest, guide, release.yml, build-linux.mjs, useSettingsActions.test.ts

## Что
- Коммит и push в `origin/main`
- Проверка: тесты 937 passed, manifest без darwin/linux до появления assets

## Зачем
Закрыть release-audit: код и manifest в репозитории, CI может пройти тесты.

## Результат
- Push OK; пользователю: перезалить `.exe` с правильным именем на Release
