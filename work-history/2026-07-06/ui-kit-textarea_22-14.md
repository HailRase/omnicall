# UI Kit Textarea

**Дата:** 2026-07-06 22:14
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/textarea/`
- `src/renderer/components/ui/types.ts`
- `src/renderer/components/ui/index.ts`
- `docs/ui-kit/UI-KIT.md`

## Что
- Добавлен примитив `Textarea` с размерами `sm|md|lg`, `invalid`, `resize: none|vertical`
- CSS Module на семантических токенах, состояния через `data-*` и ARIA
- Storybook: Default, Sizes, Disabled, Readonly, Invalid, Resize, Light/Dark
- 9 unit-тестов: textbox, change, invalid, disabled, ref, className, readonly, resize, protected props
- Barrel export и тип `TextareaResize`
- Чеклист `Textarea` в `UI-KIT.md` отмечен как done

## Зачем
Реализовать многострочный form control UI Kit по спецификации Phase 1, по образцу `Input`.

## Результат
`npx vitest run src/renderer/components/ui/textarea/Textarea.test.tsx` — 9/9 passed; `npm run lint` — ok; `npm run typecheck` — падает на существующих ошибках `Tooltip` (не связано с Textarea).
