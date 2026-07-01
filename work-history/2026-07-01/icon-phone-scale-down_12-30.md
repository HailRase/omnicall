# Уменьшение размера трубки в иконке

**Дата:** 2026-07-01 12:30
**Статус:** выполнено
**Коммит:** —

## Где
- `scripts/build-app-icons.py`
- `build/icon.svg`
- `build/icon.png`, `build/icon-512.png`, `build/icon-256.png`, `build/icon-128.png`, `build/icon-64.png`, `build/icon-48.png`, `build/icon-32.png`, `build/icon-16.png`
- `build/icon.ico`
- `build/icon.icns`
- `build/theme-icons/icon-light.png`, `build/theme-icons/icon-dark.png`

## Что
- Уменьшен целевой размер рендера handset в генераторе (`target_w/target_h`).
- Масштаб трубки снижен примерно на 18% относительно предыдущего состояния.
- Пересобран полный набор иконок для всех платформ и тем.

## Зачем
- Убрать визуальный выход трубки слишком близко к границам squircle.
- Сохранить читаемость и аккуратные отступы по периметру.

## Результат
- Трубка стала заметно компактнее и не «лезет» к краям.
- Проверки: `python scripts/build-app-icons.py` (ok).
