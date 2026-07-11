# Windows installer build

**Дата:** 2026-07-12 00:31
**Статус:** выполнено
**Коммит:** `60a5640`

## Где
- `dist/win/Axatalk-0.8.0-win-x64.exe`
- `dist/win/Axatalk-0.8.0-win-x64.msi`

## Что
- Выполнена `npm run build:win` после остановки запущенного Axatalk (EBUSY на `win-unpacked`)
- Собран NSIS `.exe` и MSI `0.8.0`

## Зачем
- Локальная сборка установщика с актуальным кодом video-integration.

## Результат
- `npm run build:win` — PASS (exit 0)
