# UI Kit: Button baseline fix

**Дата:** 2026-07-06 22:00
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/button/`
- `src/renderer/styles/tokens.css`
- `docs/ui-kit/UI-KIT.md`

## Что
- `...rest` перенесён перед controlled props (`disabled`, `aria-busy`, `data-loading`, `onClick`)
- Удалены CSS `filter`/`brightness` у primary, destructive, link; hover/active на semantic tokens
- Добавлены токены `--color-accent-primary-hover/active`, `--color-status-failed-hover/active` (light/dark)
- Расширены тесты: type, ref, className, loading disabled, защита controlled attrs (10 тестов)
- Storybook Light/Dark Theme показывают все 6 variants
- Button checklist в `UI-KIT.md` отмечен `done`

## Зачем
Закрыть оставшиеся baseline gates Button: controlled props, semantic states, тесты и light/dark parity.

## Результат
- `npx vitest run src/renderer/components/ui/button/Button.test.tsx` — 10/10 passed
- `npm run lint` — passed
- `npm run typecheck` — passed
- Следующий компонент: `IconButton`
