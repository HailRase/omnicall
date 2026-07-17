# UI Kit ButtonGroup

**Дата:** 2026-07-17 10:55
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/button-group/`
- `src/renderer/components/ui/index.ts`
- `src/renderer/components/ui/types.ts`
- `docs/ui-kit/UI-KIT.md`
- `package.json` (`@radix-ui/react-separator`)

## Что
- Добавлено семейство `ButtonGroup` / `ButtonGroupText` / `ButtonGroupSeparator` по API shadcn
- Стили joined-edges через CSS Modules и semantic tokens (horizontal/vertical)
- `ButtonGroupText` через Radix `Slot` (`asChild`), separator через `@radix-ui/react-separator`
- Storybook `UI Kit/Button Group` (light/dark) и Vitest-покрытие
- Обновлены barrel export и checklist в `UI-KIT.md`

## Зачем
- Переиспользуемая группировка action-кнопок без product-логики, в духе shadcn + Radix

## Результат
- `npx vitest run src/renderer/components/ui/button-group/ButtonGroup.test.tsx` — 11/11 ✓
- `npm run lint` — ✓
- `npm run typecheck` — ✓
- Следующий UI Kit компонент: `Card`
