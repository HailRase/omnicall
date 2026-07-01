# Переработка формы иконки телефона и dark-темы

**Дата:** 2026-07-01 12:18
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
- Полностью заменён силуэт трубки на форму в стиле `lucide-phone` (без дуги-смайлика).
- Трубка рендерится через high-res polyline + round caps с последующим downsample для чёткости на малых размерах.
- Обновлён мастер SVG: новая path-форма белой трубки.
- Реализованы отдельные палитры и рендер для `light` и `dark` иконок, а не изменение opacity.
- Перегенерирован весь набор PNG/ICO/ICNS и runtime theme-icons.

## Зачем
- Исправить неправильную визуальную интерпретацию трубки и привести стиль к ожидаемому виду.
- Сделать тёмную иконку отдельным дизайном с заметно другой цветовой схемой.

## Результат
- Иконки пересобраны; прозрачность углов сохранена (alpha=0).
- Проверки: `python scripts/build-app-icons.py` (ok), проверка различий `icon-light.png` vs `icon-dark.png` (mean diff подтверждён), углы без белых артефактов.
