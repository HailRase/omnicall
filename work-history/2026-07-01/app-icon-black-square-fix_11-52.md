# Исправление иконки (чёрный квадрат)

**Дата:** 2026-07-01 11:52
**Статус:** выполнено
**Коммит:** —

## Где
- `build/icon.png`, `build/icon.ico`
- `src/main/resolveAppIconPath.ts`, `src/main/index.ts`
- `src/renderer/index.html`, `src/renderer/public/icon.png`
- `electron-builder.yml`

## Что
- Восстановлен повреждённый `build/icon.png` (~4 КБ → ~1.1 МБ) из исходного арта
- Сгенерирован `build/icon.ico` для Windows (панель задач и установщик)
- `resolveAppIconPath()` выбирает `.ico` на win32, с проверкой `existsSync`
- Favicon в dev: `href="/icon.png"` для Vite
- Лог `app_icon_load_failed` при пустом `nativeImage`

## Зачем
Чёрный квадрат в панели Windows из-за битого PNG и отсутствия `.ico`.

## Результат
- `npm run typecheck` — OK
- Перезапустить `npm run dev` для подхвата main-процесса
