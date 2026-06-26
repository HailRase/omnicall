# Полировка заголовка и кнопки закрытия настроек

**Дата:** 2026-06-26 14:43
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/settingsSections.ts`
- `src/renderer/components/settings/SettingsPanel.module.css`
- `src/renderer/components/settings/SettingsPanel.test.tsx`

## Что
- Заголовок body: `Настройки (Общее)` вместо `Настройки → Общее`
- Кнопка закрытия — ghost-стиль: прозрачный фон, без рамки, только иконка крестика
- Hover/focus-visible по токенам дизайн-системы

## Зачем
Уточнить формат заголовка по запросу пользователя и убрать громоздкую bordered-кнопку закрытия.

## Результат
Settings tests 8/8 passed; lint OK.
