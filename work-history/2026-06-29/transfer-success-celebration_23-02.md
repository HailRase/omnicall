# Анимация успешного перевода

**Дата:** 2026-06-29 23:02
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/transferSuccessCelebration.ts`
- `src/renderer/hooks/useTransferSuccessCelebration.ts`
- `src/renderer/components/call/TransferSuccessOverlay.tsx`
- `src/renderer/shells/call/CallContextShell.tsx`, `CallControlsShell.tsx`
- `docs/softphone/Feature-Registry.md` (F-006, F-007)

## Что
- Application-хелпер `isTransferSuccessCelebrationEvent` для `CallTransferred` и `AttendedTransferCompleted`
- UI-хук с подпиской на domain events, TTL 2.5 с, ручное закрытие, досрочный выход при входящем
- Overlay: зелёный круг, анимированная галочка (SVG stroke), текст «Перевод выполнен успешно»
- Контекстная зона и controls скрываются на время celebration; после — обычный idle/dialpad
- Storybook light/dark, unit/component тесты, ui:catalog

## Зачем
Закрыть UX-состояние «transfer success» из blueprint: явная обратная связь после слепого и сопровождаемого перевода без изменения domain/use cases.

## Результат
827 passed, 1 skipped; lint и typecheck — ok; `npm run ui:catalog` — ok.
