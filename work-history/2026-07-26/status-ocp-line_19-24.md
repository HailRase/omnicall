# STATUS OCP call context line

**Дата:** 2026-07-26 19:24
**Статус:** выполнено
**Коммит:** —

## Где
- docs/softphone/STATUS.md

## Что
- Заменена строка **OCP call context:** на актуальный summary с ADR-0020 / MainCallIDInfo / ocp.acd_context.read
- Убрана отсылка к DOM CustomEvent; уточнены ограничения campaign / call:*

## Зачем
- Синхронизировать STATUS с текущим контрактом OCP call context и SDK wire

## Результат
- Точное совпадение новой строки подтверждено (Match: True, len 431, em dash U+2014)