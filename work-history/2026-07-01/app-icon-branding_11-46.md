# Иконка приложения Axatalk

**Дата:** 2026-07-01 11:46
**Статус:** выполнено
**Коммит:** —

## Где
- `build/icon.png` — исходник 1024×1024 для electron-builder
- `src/renderer/public/icon.png` — favicon 256×256
- `src/main/resolveAppIconPath.ts`, `src/main/index.ts`
- `electron-builder.yml`, `electron.vite.config.ts`
- `docs/softphone/App-Icon.md`, `build/README.md`

## Что
- Создана иконка с телефоном на синем градиенте в фирменных цветах Axatalk
- Подключена к electron-builder (`buildResources`) и `extraResources` для runtime
- Окно и macOS dock используют `resolveAppIconPath()` вместо дефолтной Electron-иконки
- Добавлен favicon в `index.html` через `src/renderer/public`
- Задокументирован workflow замены иконки

## Зачем
Убрать стандартную Electron-иконку при установке, в панели задач и на ярлыках; единый брендинг Axatalk.

## Результат
- `npm run typecheck` — OK
- `npm run lint` — OK
- Для проверки установщика: `npm run build:win` и осмотреть ярлык/NSIS-мастер
