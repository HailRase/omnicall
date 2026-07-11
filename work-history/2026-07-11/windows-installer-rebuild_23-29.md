# Windows installer rebuild

**Дата:** 2026-07-11 23:29
**Статус:** выполнено
**Коммит:** `7e734db`

## Где
- `dist/win/Axatalk-0.8.0-win-x64.exe`
- `dist/win/Axatalk-0.8.0-win-x64.msi`

## Что
- Повторно выполнена `npm run build:win`
- Пересобран NSIS `.exe` и MSI `0.8.0`

## Зачем
- Повторная локальная сборка установщика по запросу пользователя.

## Результат
- `npm run build:win` — PASS (exit 0)
- Актуальные файлы в `dist/win/`
