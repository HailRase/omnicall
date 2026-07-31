# UI Kit Accordion family

**Дата:** 2026-07-21 21:42
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/accordion/`
- `src/renderer/components/ui/index.ts`
- `docs/ui-kit/UI-KIT.md`
- `docs/ui-kit/VISUAL-SPEC.md`
- `package.json` (`@radix-ui/react-accordion`)

## Что
- Добавлено семейство Accordion (Root / Item / Trigger / Content) на Radix Accordion
- CSS Modules + семантические токены, light/dark через `data-theme`
- Storybook `UI Kit/Accordion`, Vitest (open/close, keyboard, disabled, controlled, className)
- Обновлены checklist UI-KIT и Accordion Canon в VISUAL-SPEC
- Chevron через `AppIcon` (`ui.select.chevron`)

## Зачем
- Переиспользуемый shadcn-like Accordion для UI Kit без product state и Tailwind

## Результат
- `npx vitest run src/renderer/components/ui/accordion/Accordion.test.tsx` — 9/9 ✓
- eslint / tsc по затронутым файлам — без ошибок Accordion
