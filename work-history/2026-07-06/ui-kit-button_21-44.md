# UI Kit: Button

**Дата:** 2026-07-06 21:44
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/button/`
- `src/renderer/components/ui/types.ts`
- `src/renderer/components/ui/index.ts`
- `docs/ui-kit/UI-KIT.md`

## Что
- Создана папка UI Kit и barrel export `components/ui/index.ts`
- Добавлены shared types: `ButtonVariant`, `ButtonSize`, `ControlSize`
- Реализован `Button` с 6 variants, 4 sizes, loading, fullWidth, forwardRef
- CSS Module по `VISUAL-SPEC.md` на semantic tokens
- Storybook `UI Kit/Button` (Default, Variants, Sizes, Disabled, Loading, themes, ActionRow)
- Vitest: 5 тестов interaction и a11y
- Phase 0 Foundation и Button checklist отмечены done в `UI-KIT.md`

## Зачем
Первый визуальный baseline UI Kit — переиспользуемая кнопка вместо локальных стилей в product-компонентах.

## Результат
- `npx vitest run src/renderer/components/ui/button/Button.test.tsx` — 5/5 passed
- `npm run lint` — passed
- `npm run typecheck` — passed
- Следующий компонент: `IconButton`
