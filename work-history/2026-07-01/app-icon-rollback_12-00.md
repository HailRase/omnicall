# Откат кастомных иконок

**Дата:** 2026-07-01 12:00
**Статус:** выполнено
**Коммит:** —

## Где
- Удалены: `build/icon.png`, `build/icon.ico`, `src/main/resolveAppIconPath.ts`, `src/main/loadAppIcon.ts`, `scripts/build-app-icons.mjs`, `docs/softphone/App-Icon.md`, `src/renderer/public/`
- Откачены: `src/main/index.ts`, `electron-builder.yml`, `electron.vite.config.ts`, `src/renderer/index.html`, `package.json`, `build/README.md`

## Что
- Убрана загрузка иконки в main-процессе и dock
- Удалены extraResources для icon.png/ico
- Убран favicon и publicDir renderer
- Удалён скрипт `icons:build` и документация App-Icon

## Зачем
Запрос пользователя вернуть состояние до работы над иконками.

## Результат
- `npm run typecheck` — OK
- Снова используется стандартная Electron-иконка до появления `build/icon.png`
