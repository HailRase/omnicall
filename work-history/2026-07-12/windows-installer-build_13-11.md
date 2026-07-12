# Windows installer build

**Дата:** 2026-07-12 13:11
**Статус:** выполнено
**Коммит:** —

## Где
- `dist/win/Axatalk-0.9.0-win-x64.exe`
- `dist/win/Axatalk-0.9.0-win-x64.msi`

## Что
- Выполнена `npm run build:win` (icons → production bundle → electron-builder)
- Собран NSIS-установщик `Axatalk-0.9.0-win-x64.exe`
- Собран MSI `Axatalk-0.9.0-win-x64.msi` для IT-развёртывания

## Зачем
- Локальная установка Axatalk на Windows для пользователя.

## Результат
- `npm run build:win` — PASS (exit 0, Node v22.23.1)
- Установщик: `D:\Axata\softphone-electron\dist\win\Axatalk-0.9.0-win-x64.exe`
