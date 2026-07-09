# Rebuild Windows installer

**Дата:** 2026-07-10 00:20
**Статус:** выполнено
**Коммит:** —

## Где
- `dist/win-fix/Axatalk-0.8.0-win-x64.exe`
- `dist/win-fix/Axatalk-0.8.0-win-x64.msi`

## Что
- Пересобрал Windows installer с текущими video bugfixes
- Output в `dist/win-fix` (старый Axatalk держал lock на `dist/win`)

## Зачем
- Дать свежий `.exe` для установки и проверки фиксов

## Результат
- `npm run build:dist` + electron-builder win — success
