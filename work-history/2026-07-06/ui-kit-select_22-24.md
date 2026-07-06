# UI Kit Select

**Дата:** 2026-07-06 22:24
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/select/`
- `src/renderer/components/ui/index.ts`
- `src/renderer/components/icons/iconCatalog.ts`
- `docs/softphone/Icon-Registry.md`
- `src/renderer/i18n/messages.ts`
- `package.json` (`@radix-ui/react-select`)

## Что
- Реализован `Select` на Radix Select с items API, размерами sm/md/lg, placeholder, disabled и invalid
- Добавлены CSS Module, Storybook (`UI Kit/Select`), 11 тестов с jsdom-полифиллами для Radix
- Добавлена иконка `ui.select.chevron` (ChevronDown) в каталог и i18n (ru/en/fr/de)
- Экспорт из корневого UI Kit barrel; чеклист Select в `UI-KIT.md` закрыт

## Зачем
Единый переиспользуемый select-примитив для форм с клавиатурой, typeahead и визуальным каноном overlay/menu.

## Результат
- `npx vitest run src/renderer/components/ui/select/Select.test.tsx` — 11/11
- `npm run lint` — ok
- `npm run typecheck` — ok
