# UI Kit IconButton baseline fix

**Дата:** 2026-07-06 22:00
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/icon-button/`
- `docs/ui-kit/UI-KIT.md`

## Что
- `{...rest}` перенесён перед controlled props (`disabled`, `aria-label`, `aria-busy`, `data-loading`, `onClick`)
- Hover/active primary/destructive переведены на semantic tokens вместо CSS `filter`/`brightness`
- Storybook Light/Dark Theme показывают все 5 вариантов
- Добавлены 7 baseline-тестов: type, ref, className, loading disabled, disabled click block, disabledReason tooltip, protected attributes
- IconButton отмечен `done` в UI-KIT.md

## Зачем
Закрыть оставшиеся P0 baseline gates IconButton: защита controlled props, semantic hover/active, полный light/dark coverage в Storybook и тестах.

## Результат
- `npx vitest run src/renderer/components/ui/icon-button/IconButton.test.tsx` — 13/13 passed
- ReadLints — без ошибок
- Следующий компонент: `Input`
