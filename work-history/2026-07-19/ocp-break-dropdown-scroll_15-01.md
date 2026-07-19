# Скролл списка перерывов в OCP status dropdown

**Дата:** 2026-07-19 15:01
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/integration/ocp/OcpStatusDropdown.tsx`
- `src/renderer/components/integration/ocp/OcpStatusDropdown.module.css`
- `src/renderer/widgets/OperatorStatusSelector/OperatorStatusSelector.stories.tsx`
- `docs/softphone/Feature-Registry.md`

## Что
- Ready («Доступен») закреплён сверху dropdown
- Секция Break ограничена 6 видимыми пунктами (`OCP_STATUS_BREAK_VISIBLE_COUNT`)
- При >6 перерывов — независимый вертикальный скролл только у break-группы
- Тест + Storybook `ManyBreakReasonsScroll`

## Зачем
Длинный список причин перерыва не должен удлинять меню и прятать Ready.

## Результат
- Фокусные тесты `OcpStatusDropdown` / `OperatorStatusSelector` — green
- lint:css + ui:catalog — green
