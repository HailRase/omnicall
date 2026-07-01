# Filter win-unpacked exe from distribution

**Дата:** 2026-07-01 18:35
**Статус:** выполнено
**Коммит:** —

## Где
- `scripts/distribution-config.mjs` — `isDistributionInstallerFile`
- `release.yml`, migrate, publish scripts

## Что
- Только `Axatalk-{version}-*` installers, не `Axatalk.exe` / `elevate.exe`

## Зачем
v0.0.2 release включал артефакты из `win-unpacked`.

## Результат
Удалить лишние assets вручную на GitHub; следующие релизы — чистые.
