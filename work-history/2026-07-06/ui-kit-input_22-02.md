# UI Kit Input

**Дата:** 2026-07-06 22:02
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/input/`
- `src/renderer/components/ui/index.ts`
- `docs/ui-kit/UI-KIT.md`

## Что
- Реализован `Input` с размерами `sm | md | lg`, `invalid`, `prefix`/`suffix`
- CSS Module по Form Visual Canon: surface, control border, danger invalid, disabled/readonly
- Storybook: Default, Sizes, Disabled, Readonly, Invalid, Prefix/Suffix, Light/Dark
- 9 unit-тестов: textbox, onChange, aria-invalid, disabled guard, ref, className, affixes
- Barrel export и чеклист Input в `UI-KIT.md` отмечены done

## Зачем
P0 UI Kit primitive для единообразных текстовых полей вместо локальных input-стилей.

## Результат
- `npm run test -- src/renderer/components/ui/input/Input.test.tsx` — 9/9 passed
- `npm run lint` — passed
- `npm run typecheck` — ошибки только в pre-existing `DropdownMenu.test.tsx`, Input без ошибок
