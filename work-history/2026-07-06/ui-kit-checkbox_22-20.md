# UI Kit Checkbox

**Дата:** 2026-07-06 22:20
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/checkbox/`
- `src/renderer/components/ui/index.ts`
- `docs/ui-kit/UI-KIT.md`
- `package.json` (`@radix-ui/react-checkbox`)

## Что
- Реализован `Checkbox` на `@radix-ui/react-checkbox` с checked/unchecked/indeterminate/disabled/invalid
- CSS Module с semantic tokens, focus ring, accent fill для checked/indeterminate
- Storybook: Default, Checked, Indeterminate, Disabled, Invalid, Light/Dark Theme
- 9 unit-тестов: click, keyboard, controlled state, disabled guard, ref, className, invalid, protected props
- Barrel export из UI Kit root
- Чеклист Checkbox в `UI-KIT.md` отмечен done

## Зачем
Добавить переиспользуемый P1-примитив boolean selection для форм и настроек вместо локальных checkbox-стилей.

## Результат
- `npx vitest run src/renderer/components/ui/checkbox/Checkbox.test.tsx` — 9/9 passed
- `npm run lint` — passed
- `npm run typecheck` — падает на несвязанных файлах (`select`, `iconCatalog`), не на Checkbox
