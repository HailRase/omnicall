# UI catalog check — детерминированная генерация

**Дата:** 2026-06-25 21:25
**Статус:** выполнено
**Коммит:** —

## Где
- `scripts/generate-ui-catalog.mjs`
- `docs/softphone/UI-Component-Catalog.md`

## Что
- Удалена строка `Last generated:` с UTC-timestamp из генератора каталога
- Перегенерирован `UI-Component-Catalog.md` без volatile-поля
- `ui:catalog:check` дважды подряд — exit 0 после staging

## Зачем
- `ui:catalog:check` падал на diff timestamp даже при актуальной таблице компонентов; повторный `ui:catalog` не помогал.

## Результат
- Генерация детерминирована: повторные запуски `ui:catalog` и `ui:catalog:check` дают идентичный вывод. Актуальность файла — по git history.
