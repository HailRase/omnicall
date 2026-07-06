# UI Kit IconButton

**Дата:** 2026-07-06 21:52
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/icon-button/`
- `src/renderer/components/ui/types.ts`
- `src/renderer/components/ui/index.ts`
- `docs/ui-kit/UI-KIT.md`

## Что
- Добавлен `IconButton` с вариантами primary/secondary/outline/ghost/destructive и размерами sm/md/lg
- Интеграция `AppIcon` (semantic `iconId`) и `IconTooltip` для опционального tooltip/disabled reason
- Обязательный `ariaLabel`, состояния loading и disabled через `disabledReason`
- CSS Module по визуальному канону Button (квадратные icon-sm/md/lg)
- Storybook `UI Kit/IconButton` и 6 unit-тестов
- Barrel export и обновление чеклиста UI-KIT

## Зачем
P0 UI Kit primitive для icon-only действий с единым стилем и доступностью вместо локальных дубликатов.

## Результат
- `npx vitest run src/renderer/components/ui/icon-button/IconButton.test.tsx` — 6/6 passed
- `npm run lint` — passed
- `npm run typecheck` — passed
- Следующий компонент: `Input`
