# Раздельные папки dist для платформ

**Дата:** 2026-06-30 20:58
**Статус:** выполнено
**Коммит:** —

## Где
- `package.json` — скрипты `build:win|mac|linux|all`
- `electron-builder.yml`, `.github/workflows/release.yml`
- `install-instruction.md`, `docs/softphone/Feature-Registry.md`

## Что
- `build:win` → `dist/win`, `build:mac` → `dist/mac`, `build:linux` → `dist/linux`, `build:all` → `dist/all` через `-c.directories.output`
- Обновлены пути артефактов в GitHub Actions release workflow
- Обновлены инструкция установки и Feature Registry (F-019)

## Зачем
Разнести артефакты сборки по платформам, чтобы параллельные или последовательные сборки не перезаписывали друг друга в корне `dist/`.

## Результат
- `npm run build:win` — exit 0, установщик в `dist/win/Enterprise Softphone-0.0.1-win-x64.exe`
- Старые файлы в корне `dist/` от предыдущих сборок не удалялись
