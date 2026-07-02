# Settings System State UX redesign

**Дата:** 2026-07-02 15:30
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/panels/SettingsSystemStatePanel.tsx`
- `src/renderer/components/settings/panels/SettingsSystemStatePanel.module.css`
- `src/renderer/components/settings/panels/settingsSystemStatePanelHelpers.ts`
- `src/renderer/hooks/useSipSystemStateActions.ts`
- `src/application/projections/deriveSipSystemStateShell.ts`

## Что
- Компактная панель текущего состояния с цветовыми индикаторами и `aria-live`
- Группировка блоков автовосстановления, анимация зависимых полей, disabled + валидация интервалов
- Ручные действия: кнопка + краткая причина, loading/success feedback, `aria-describedby`
- Пустое состояние журнала с иконкой и подсказкой; подсветка новых записей
- Унификация меток «Неактивно/Неактивна» в projection
- Тесты и responsive/a11y стили (light + dark через токены)

## Зачем
Expert-level UX/UI redesign страницы «Состояние системы» по Nielsen/WCAG без нарушения контрактов `data-testid` и CSS-модулей.

## Результат
- `npm run test` — 1016 passed, 1 skipped
- `npm run lint` — ok
- `npm run typecheck` — ok
- `npm run ui:catalog` — ok
