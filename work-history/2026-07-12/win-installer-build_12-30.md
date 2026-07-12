# Локальная сборка установщиков

**Дата:** 2026-07-12 12:30
**Статус:** выполнено (частично — только Windows)
**Коммит:** —

## Где
- `dist/win/`
- `package.json` (`build:win` / `build:mac`)
- `electron-builder.yml`

## Что
- Запущен `npm run build:win` (v0.8.0)
- Получены `Axatalk-0.8.0-win-x64.exe` и `Axatalk-0.8.0-win-x64.msi`
- `.dmg` (macOS arm64) не собран: текущая машина Windows; electron-builder требует macOS/`macos-latest`
- `gh` не авторизован — CI release не запускался

## Зачем
- Пользователю нужны установщики `.exe` и `.dmg` (Apple Silicon) для установки приложения

## Результат
- Windows: готово — `dist/win/Axatalk-0.8.0-win-x64.exe` (~85 MB)
- macOS Silicon DMG: недоступно с этой ОС; нужен Mac (`npm run build:mac`) или CI tag `v*` → axatalk-releases
