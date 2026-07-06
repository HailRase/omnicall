# UI Kit FormField

**Дата:** 2026-07-06 22:19
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/form-field/`
- `src/renderer/components/ui/index.ts`
- `docs/ui-kit/UI-KIT.md`

## Что
- Реализован `FormField`: label, control, hint, error с `useId` и `cloneElement`
- Связка `htmlFor` / `id`, `aria-describedby`, `aria-invalid` при ошибке
- Ошибка имеет приоритет над hint; hint скрывается при наличии error
- CSS Module с токенами `--color-text-secondary` и `--color-text-danger`
- Storybook `UI Kit/FormField` (Default, Hint, Error, Required, Disabled, light/dark)
- 10 unit-тестов; barrel export

## Зачем
Единая обёртка форм UI Kit для `Input`/`Textarea` с доступной разметкой label и сообщений.

## Результат
- `npm run test -- --run src/renderer/components/ui/form-field/FormField.test.tsx` — 10/10
- `npm run lint` — ok
- `npm run typecheck` — ok
