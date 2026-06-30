# Incoming call session card (F-002)

**Дата:** 2026-06-30 10:04
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/call/IncomingCallSessionCard.tsx`
- `src/renderer/shells/call/CallContextShell.tsx`
- `src/renderer/shells/call/CallControlsShell.tsx`
- `src/renderer/hooks/useCallFeatureShell.ts`
- `src/renderer/helpers/buildIncomingControlLine.ts`

## Что
- Добавлен `IncomingCallSessionCard` — зелёная selectable-карточка в зоне сессий с «Ответить»/«Отклонить»
- Входящий автоматически выбирается; можно переключить selection на другую сессию
- При выбранном входящем ControlsBar показывает все кнопки disabled, кроме «Завершить» (reject)
- `IncomingCallOverlay` убран из `SoftphoneReadyShell`
- Тесты, Storybook, обновлён Feature Registry и UI catalog

## Зачем
Перенести UX входящего вызова из header overlay в список сессий с единым паттерном selection и ControlsBar.

## Результат
`npm run test` — 837 passed, 1 skipped; `npm run lint` — ok; `npm run typecheck` — ok; `npm run ui:catalog` — ok
