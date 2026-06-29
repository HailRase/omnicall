# Выбор сессии без снятия с удержания

**Дата:** 2026-06-29 21:22
**Статус:** выполнено
**Коммит:** `94d8202`

## Где
- `src/renderer/hooks/useCallFeatureShell.ts`
- `src/renderer/shells/call/CallContextShell.tsx`
- `src/renderer/components/call/CallSessionCard.tsx`
- `src/renderer/components/call/CallSessionCard.module.css`
- `src/renderer/components/call/CallSessionCard.test.tsx`
- `src/renderer/components/call/CallSessionCard.stories.tsx`

## Что
- Добавлено UI-состояние `selectedCallId` и `selectCallLine` в `useCallFeatureShell`
- `controlTargetLine` учитывает явный выбор пользователя — ControlsBar отражает выбранную сессию
- Клик по удержанной линии в стеке больше не вызывает resume, только выбор
- Визуальная подсветка выбранной карточки: accent border + inset bar (`compactSelected`)
- Обновлены aria-label, статус «На удержании · выбран», тесты и Storybook

## Зачем
При нескольких звонках на удержании оператор должен переключать контекст ControlsBar без автоматического снятия с удержания.

## Результат
814 passed, 1 skipped; lint и typecheck — green.
