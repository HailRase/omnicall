# Утончённый dismiss на вкладках профиля

**Дата:** 2026-07-07 10:16
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/account/SavedAccountProfileSelector.tsx`
- `src/renderer/components/account/SavedAccountProfileSelector.module.css`

## Что
- Заменена громоздкая иконка корзины на компактный `overlay.close` (12px) внутри вкладки
- Dismiss скрыт по умолчанию и появляется при hover/focus вкладки; на touch — только на активной вкладке
- Стилизация объединена в единую «пилюлю» вкладки (shell), без отдельной кнопки справа
- При hover dismiss подсвечивается деликатным danger-tint, без красной кнопки

## Зачем
Сделать удаление профиля визуально лёгким и согласованным с UI Kit Tabs, а не отдельным громоздким контролом.

## Результат
Тесты селектора — OK; `npm run lint` — OK.
