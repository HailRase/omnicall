# Доведение трубки до lucide-phone 1-в-1

**Дата:** 2026-07-01 12:28
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
- В генераторе добавлена точная геометрия `lucide-phone` path вместо “похожего” силуэта.
- Реализована дискретизация SVG arc-команд (`A`/`a`) и построение полилинии по исходной форме lucide.
- Обновлён `icon.svg` с исходным `lucide-phone` path и масштабом в мастер-иконке.
- Перегенерирован весь набор PNG/ICO/ICNS и theme-aware ассеты.

## Зачем
- Обеспечить форму handset 1-в-1 под `lucide-phone` по вашему требованию.
- Сохранить единый master-дизайн во всех экспортируемых форматах.

## Результат
- Все иконки пересобраны с новой геометрией трубки.
- Проверки: `python scripts/build-app-icons.py` (ok), наличие итоговых master/theme файлов (ok).
