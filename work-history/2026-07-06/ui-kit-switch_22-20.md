# UI Kit Switch

**Дата:** 2026-07-06 22:20
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/switch/`
- `src/renderer/components/ui/index.ts`
- `docs/ui-kit/UI-KIT.md`
- `package.json` (`@radix-ui/react-switch`)

## Что
- Реализован `Switch` на `@radix-ui/react-switch` с CSS Modules и семантическими токенами
- Добавлены Storybook-истории: Default, Checked, Disabled, With Label, Light/Dark Theme
- Добавлены Vitest-тесты: role, toggle, onCheckedChange, disabled, ref, className, protected disabled
- Экспорт из barrel `src/renderer/components/ui/index.ts`
- Чеклист Switch в `UI-KIT.md` отмечен как done

## Зачем
Дать переиспользуемый UI Kit-примитив для on/off-настроек вместо локальных switch-стилей в product-компонентах.

## Результат
`npx vitest run src/renderer/components/ui/switch/Switch.test.tsx` — 7/7 passed; `npm run lint` — ok; `npm run typecheck` — падает на существующих ошибках в `Select.tsx`, не связанных с Switch.
