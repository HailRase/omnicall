# macOS icon HIG padding (Dock / Launchpad)

**Дата:** 2026-07-07 16:18
**Статус:** выполнено
**Коммит:** —

## Где
- `scripts/build-app-icons.py`
- `build/icon.icns`
- `build/theme-icons/icon-light.png`, `build/theme-icons/icon-dark.png`
- `build/README.md`

## Что
- Добавлен `compose_macos_icon_canvas`: artwork 824×824 по центру холста 1024×1024 (100px gutter, Apple HIG)
- Только macOS-артефакты: `icon.icns` и `theme-icons/*` (Dock в dev/runtime)
- Windows/Linux (`icon.ico`, `icon.png`, `build/icons/`) без изменений

## Зачем
Иконка на Mac выглядела крупнее соседних в Dock и Launchpad из-за full-bleed artwork.

## Результат
- `python scripts/build-app-icons.py` — ok
- Пересобрать `.app`/`.dmg` (`npm run build:mac`) для Launchpad; dev Dock подхватит `theme-icons` после перезапуска
