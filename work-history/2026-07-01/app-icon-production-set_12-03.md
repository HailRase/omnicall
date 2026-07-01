# Production icon set for softphone

**Дата:** 2026-07-01 12:03
**Статус:** выполнено
**Коммит:** —

## Где
- `scripts/build-app-icons.py`
- `build/icon.svg`
- `build/icon.png`
- `build/icon-512.png`, `build/icon-256.png`, `build/icon-128.png`, `build/icon-64.png`, `build/icon-48.png`, `build/icon-32.png`, `build/icon-16.png`
- `build/icon.ico`
- `build/icon.icns`

## Что
- Добавлен генератор иконок на Python/Pillow с единым мастер-дизайном.
- Реализован squircle-контур с прозрачностью вне формы и anti-aliased alpha.
- Собран синий градиент с глянцем и мягкой внутренней тенью без внешней обводки.
- Отрисована минималистичная белая handset-форма, центрированная в пределах иконки.
- Сгенерированы все требуемые PNG-размеры, а также `ICO` с 16/32/48/256.
- Сгенерирован `ICNS` с набором стандартных размеров @1x/@2x и `SVG`-мастер.

## Зачем
- Подготовить production-ready набор иконок для Electron на macOS, Windows и Linux.
- Исключить белые углы и ореолы на тёмных/светлых фонах за счёт корректной альфы.

## Результат
- Файлы ассетов созданы в `build/` и готовы к использованию в сборке.
- Проверки: `python scripts/build-app-icons.py` (ok), проверка угловой альфы PNG (ok), проверка embedded размеров `ICO/ICNS` (ok).
