# Стили выбранного статуса в OCP dropdown

**Дата:** 2026-07-19 15:06
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/integration/ocp/OcpStatusDropdown.tsx`
- `src/renderer/components/integration/ocp/OcpStatusDropdown.module.css`
- `src/renderer/widgets/OperatorStatusSelector/OperatorStatusSelector.stories.tsx`
- `docs/softphone/Feature-Registry.md`

## Что
- Текущий Ready: зелёный border/текст (`--color-status-online`), некликабельный
- Текущий Break: оранжевый border/текст (`--color-status-dnd`), некликабельный
- Hover Ready/Break — те же акценты; active сохраняет цвет
- Без «серого» disabled-look у current; light/dark через токены
- Тесты + stories `CurrentBreakSelectedLight/Dark`

## Зачем
Визуально выделить активный статус в списке options и запретить повторный клик.

## Результат
- `OcpStatusDropdown` tests — 3/3 green
- lint:css — green
