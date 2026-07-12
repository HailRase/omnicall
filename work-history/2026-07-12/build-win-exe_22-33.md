# Windows build (.exe)

**Дата:** 2026-07-12 22:33
**Статус:** выполнено
**Коммит:** —

## Где
- `dist/win/Axatalk-0.10.2-win-x64.exe`
- `dist/win/Axatalk-0.10.2-win-x64.msi`
- `dist/win/win-unpacked/Axatalk.exe`

## Что
- Запущен `npm run build:win` (иконки → production build → electron-builder)
- Собран NSIS-инсталлятор `Axatalk-0.10.2-win-x64.exe` (~85 МБ)
- Собран MSI `Axatalk-0.10.2-win-x64.msi` (~97 МБ)
- Распакованная сборка в `dist/win/win-unpacked/`

## Зачем
- Локальная сборка Windows-дистрибутива по запросу пользователя.

## Результат
- `npm run build:win` — exit 0 (~2 мин 15 сек).
