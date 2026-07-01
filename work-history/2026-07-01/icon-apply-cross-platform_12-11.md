# Применение иконок для всех ОС

**Дата:** 2026-07-01 12:11
**Статус:** выполнено
**Коммит:** —

## Где
- `electron-builder.yml`
- `src/main/index.ts`
- `src/main/loadAppIcon.ts`
- `src/main/resolveAppIconPath.ts`
- `src/preload/index.ts`
- `src/shared/ipc/IpcChannels.ts`, `src/shared/ipc/PreloadApi.ts`, `src/shared/ipc/SetNativeThemeContract.ts`
- `src/renderer/hooks/useSettingsActions.ts`
- `scripts/build-app-icons.py`
- `build/icon.png`, `build/icon-*.png`, `build/icon.ico`, `build/icon.icns`, `build/theme-icons/icon-dark.png`, `build/theme-icons/icon-light.png`
- `docs/softphone/Feature-Registry.md`, `package.json`

## Что
- Прописаны platform icons в `electron-builder.yml` для `win/mac/linux`.
- Добавлен `extraResources` для runtime theme-иконок (`theme-icons/icon-dark.png`, `icon-light.png`).
- В main-процесс добавлена theme-aware загрузка иконки с обновлением по `nativeTheme` и смене темы.
- Добавлен typed IPC контракт `platform:set-native-theme` с валидацией payload на preload/main границе.
- В renderer (`useSettingsActions`) добавлена синхронизация выбранной темы с нативной темой Electron.
- Обновлён генератор ассетов: теперь создаёт основной набор + theme-aware PNG для runtime.

## Зачем
- Обеспечить корректное отображение иконки на macOS, Windows и Linux при сборке и рантайме.
- Синхронизировать light/dark тему приложения с нативной иконкой без нарушения архитектурных границ.

## Результат
- Кроссплатформенные иконки подключены и подхватываются сборщиком и main-процессом.
- Проверки: `python scripts/build-app-icons.py` (ok), `npm run typecheck` (ok), `npm run lint` (ok), проверка alpha углов theme-иконок (ok).
