# Публикация @softomnitel/omnicall-kit@0.1.1

**Дата:** 2026-07-28 11:08
**Статус:** выполнено
**Коммит:** —

## Где
- npm: `@softomnitel/omnicall-kit@0.1.1` (`latest`)
- `omnicall-kit/packages/sdk/package.json`
- `omnicall-kit/packages/sdk/README.md`
- `omnicall-kit/packages/sdk/CHANGELOG.md`
- `omnicall-kit/README.md`
- `omnicall-kit/docs/guide/release-and-support.md`

## Что
- Синхронизирован npm README с эталонной русской документацией (пути `../../…`).
- Patch-релиз `0.1.1` (только docs/README; API без изменений).
- Опубликован пакет на npm tag `latest` под `hailrase`.
- Protocol остаётся на `0.1.0` (перепубликация не требовалась).

## Зачем
- Обновить страницу npm актуальным русским README после аудита документации.

## Результат
- `npm publish -w @softomnitel/omnicall-kit` → `+ @softomnitel/omnicall-kit@0.1.1`
- `npm view @softomnitel/omnicall-kit version` → `0.1.1`
- Токен из чата нужно немедленно ротировать на npm; в репозиторий не записывался.
