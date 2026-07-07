# Alert layout shadcn alignment

**Дата:** 2026-07-07 13:09
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/alert/Alert.tsx`
- `src/renderer/components/ui/alert/Alert.module.css`
- `src/renderer/components/ui/alert/Alert.test.tsx`
- `src/renderer/components/ui/alert/Alert.stories.tsx`
- `docs/ui-kit/UI-KIT.md`

## Что
- Добавлены `data-slot` маркеры (`alert`, `alert-title`, `alert-description`, `alert-action`) для CSS-селекторов
- Компактные отступы и `row-gap: 2px` между title и description
- Grid с иконкой: `auto 1fr`, иконка `row-span: 2` с лёгким смещением вниз
- `AlertAction` вынесен в абсолютное позиционирование справа; root резервирует `padding-right` при action
- Title: `font-weight: 500`; ссылки в title/description со underline
- Story `PaymentSuccess` и тесты на `data-slot` и action layout

## Зачем
Привести расположение элементов Alert к shadcn-канону: иконка слева на две строки, title/description в колонке контента, action справа.

## Результат
`npx vitest run src/renderer/components/ui/alert/Alert.test.tsx` — 10/10 passed.
