# UI Kit Dialog

**Дата:** 2026-07-06 22:15
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/dialog/`
- `docs/ui-kit/UI-KIT.md`
- `src/renderer/components/ui/index.ts`
- `src/renderer/components/ui/types.ts`

## Что
- Реализован composable `Dialog` на `@radix-ui/react-dialog` с `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`
- Добавлены размеры `sm | md | lg | fullscreen`, scrim overlay, close-кнопка через `IconButton` + `overlay.close`
- CSS Modules с токенами overlay, анимацией open/close и `prefers-reduced-motion`
- Storybook: Default, Sizes, With Footer, Controlled, Long Content, Light/Dark
- 8 Vitest-тестов: open/close, escape, focus restore, a11y name, controlled state, className
- Обновлён чеклист UI-KIT.md, barrel export и тип `DialogSize`

## Зачем
Дать продукту переиспользуемый модальный примитив UI Kit с Radix focus trap, escape и доступным именем диалога.

## Результат
`npx vitest run src/renderer/components/ui/dialog/Dialog.test.tsx` — 8/8 passed; `npm run lint` — ok; `npm run typecheck` — падает на существующих ошибках Tooltip (не связано с Dialog).
