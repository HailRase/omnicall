# Incoming call session fixes

**Дата:** 2026-06-30 10:32
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/hooks/useCallFeatureShell.ts`
- `src/renderer/components/call/IncomingCallSessionCard.module.css`

## Что
- Исправлен выбор другой сессии при входящем: auto-select только при новом incoming, fallback ControlsBar отдаёт Active/Held раньше Ringing
- `userSelectedCallIdRef` сохраняет ручной выбор; ringing при visible incoming — select, не answer
- Кнопки «Отклонить» (красная) и «Ответить» (зелёная) с белым текстом/иконкой, hover через opacity

## Зачем
Позволить управлять активным звонком при параллельном входящем и улучшить контраст кнопок в light/dark.

## Результат
IncomingCallSessionCard tests + typecheck — ok
