# Cleanup legacy axatalk-sdk folders

**Дата:** 2026-07-29 23:35
**Статус:** выполнено
**Коммит:** `72edae30`

## Где
- `axatalk-sdk-integration/` (локальный leftover)
- `axatalk-sdk/` (локальный leftover: node_modules/temp)
- `.gitignore`

## Что
- Удалены локальные папки после ребрендинга в `omnicall-kit*`
- Из `.gitignore` убраны устаревшие пути `axatalk-sdk*`
- Проверено: `origin/main` не содержит деревьев `axatalk-sdk*`

## Зачем
Убрать мусор Edge-профиля DI-10 и старый SDK scratch с диска и из ignore-правил.

## Результат
- Папок `axatalk-sdk` / `axatalk-sdk-integration` на диске нет
- Актуальный путь: `omnicall-kit-integration/`

