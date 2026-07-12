# Windows installer build

**Дата:** 2026-07-11 19:46
**Статус:** выполнено
**Коммит:** `7e734db`

## Где
- `dist/win/Axatalk-0.8.0-win-x64.exe`
- `dist/win/Axatalk-0.8.0-win-x64.msi`

## Что
- Выполнена команда `npm run build:win` (icons → production bundle → electron-builder)
- Собран NSIS-установщик `Axatalk-0.8.0-win-x64.exe` (~85 MB)
- Собран MSI для IT/GPO `Axatalk-0.8.0-win-x64.msi` (~97 MB)

## Зачем
- Локальная сборка установщика для ручной установки и проверки приложения на Windows.

## Результат
- `npm run build:win` — PASS (exit 0)
- Установщик готов к запуску из `dist/win/`
