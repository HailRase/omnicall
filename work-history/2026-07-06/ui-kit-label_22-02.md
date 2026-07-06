# UI Kit Label

**Дата:** 2026-07-06 22:02
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/label/`
- `src/renderer/components/ui/index.ts`
- `docs/ui-kit/UI-KIT.md`

## Что
- Добавлен примитив `Label` с `required`, `disabled` и native label props
- CSS Module по visual canon: semibold, muted disabled, danger required marker
- Storybook `UI Kit/Label` с light/dark и связкой с input
- 8 unit-тестов: htmlFor, required, ref, className, controlled data-*
- Barrel export из UI Kit root
- Чеклист Label в `UI-KIT.md` отмечен done

## Зачем
Единый доступный label для форм UI Kit перед `Input` и `FormField`.

## Результат
`npx vitest run src/renderer/components/ui/label/Label.test.tsx` — 8/8 passed; `npm run lint` — ok; `npm run typecheck` — падает на несвязанном `DropdownMenu.test.tsx`.
