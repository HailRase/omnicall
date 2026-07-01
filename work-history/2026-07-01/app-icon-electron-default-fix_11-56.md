# Исправление Electron-иконки (битый ICO)

**Дата:** 2026-07-01 11:56
**Статус:** выполнено
**Коммит:** —

## Где
- `build/icon.ico` — пересобран без повреждения
- `src/main/loadAppIcon.ts`, `scripts/build-app-icons.mjs`
- `package.json` (`icons:build`)

## Что
- Диагностика: `app_icon_load_failed` — `nativeImage` не читал `.ico` (бинарник испорчен PowerShell-редиректом `>`)
- Перегенерирован валидный `icon.ico` через `spawnSync` / `npm run icons:build`
- `loadAppIcon()` с fallback на PNG, если ICO не декодируется
- Документация: не использовать shell-redirect для бинарных файлов

## Зачем
Electron показывал дефолтную иконку, т.к. загрузка кастомной возвращала пустой `NativeImage`.

## Результат
- Smoke: PNG и ICO → `empty: false`
- Перезапустить `npm run dev`
