# Сборка Windows OmniCall 1.2.0

**Дата:** 2026-08-01 11:42
**Статус:** выполнено
**Коммит:** —

## Где
- `dist/win/`
- `package.json` (`build:win`)

## Что
- Запущена полная Windows-сборка: иконки, production electron-vite, electron-builder
- Собран NSIS-инсталлятор `OmniCall-1.2.0-win-x64.exe`
- Собран MSI `OmniCall-1.2.0-win-x64.msi`
- Распакованный каталог: `dist/win/win-unpacked`

## Зачем
- Локальная дистрибутивная сборка OmniCall для Windows x64

## Результат
- `npm run build:win` — успех (exit 0)
- Артефакты: `dist/win/OmniCall-1.2.0-win-x64.exe` (~86 MB), `dist/win/OmniCall-1.2.0-win-x64.msi` (~98 MB)
