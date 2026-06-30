# Distribution packaging (F-019)

**Дата:** 2026-06-30 17:09
**Статус:** выполнено
**Коммит:** —

## Где
- `electron-builder.yml`, `package.json`, `.env.production`
- `.github/workflows/release.yml`, `build/README.md`
- `install-instruction.md`, `docs/softphone/Feature-Registry.md` (F-019)

## Что
- Ветка `deployment-preparation` от `origin/master`
- electron-builder: NSIS (Windows), DMG (macOS), AppImage + deb (Linux)
- Скрипты `build:win`, `build:mac`, `build:linux`, `build:dist`
- Production-сборка с `VITE_ADAPTER_MODE=real`
- GitHub Actions workflow на теги `v*.*.*`
- Инструкция `install-instruction.md` для пользователей и сборщиков

## Зачем
Подготовить распространение установщиков на Windows, macOS и Linux, чтобы другие пользователи могли установить клиент, зарегистрировать SIP и звонить.

## Результат
- `npm run build:win` — успех, артефакт `dist/Enterprise Softphone-0.0.1-win-x64.exe`
- `npm run test` — 916 passed, 1 skipped
- `npm run lint` — green
- `npm run typecheck` — green
