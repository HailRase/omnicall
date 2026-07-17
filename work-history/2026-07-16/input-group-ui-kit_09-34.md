# InputGroup UI Kit component

**Дата:** 2026-07-16 09:34
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/input-group/`
- `src/renderer/components/ui/types.ts`
- `src/renderer/components/ui/index.ts`
- `docs/ui-kit/UI-KIT.md`

## Что
- Добавлено семейство `InputGroup` по образцу shadcn: контейнер, addon, input, textarea, button, text
- Реализованы CSS Modules с общим focus ring, align-слотами и компактными кнопками
- Добавлены Storybook-истории (default, variants, sizes, disabled, invalid, textarea, light/dark)
- Добавлены 12 unit-тестов (ref, className, disabled/invalid, addon focus, protected props)
- Обновлены barrel-экспорты и чеклист `UI-KIT.md`

## Зачем
Дать продуктовым формам composable API для составных полей ввода (prefix/suffix, кнопки, textarea + action) без дублирования локальных стилей.

## Результат
- `npx vitest run src/renderer/components/ui/input-group/InputGroup.test.tsx` — 12/12 passed
- `npm run lint` — passed
- `npm run typecheck` — passed
