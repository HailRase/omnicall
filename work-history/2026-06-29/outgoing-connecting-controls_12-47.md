# Outgoing connecting: control bar + session focus

**Дата:** 2026-06-29 12:47
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/hooks/useCallFeatureShell.ts`
- `src/renderer/shells/call/CallControlsShell.tsx`, `CallContextShell.tsx`
- `src/renderer/components/call/CallControlsBar.tsx`, `CallSessionStack.tsx`, `CallSessionCard.module.css`
- `src/application/projections/activeCallControlsProjection.ts`

## Что
- Dialpad скрывается при любом активном звонке (`hasCallInProgress`), не только при established
- `controlTargetLine` — единый источник целевой сессии для control bar и подсветки
- CallControlsBar: фаза Connecting/Ringing — только микрофон и завершить; Active/Held — полный набор
- Подсветка целевой сессии бордером в CallSessionCard/Stack (без текстовых подписей)
- Projection: mute разрешён в состоянии Connecting

## Зачем
При исходящем вызове с 0 активных dialpad не должен оставаться; оператору нужны control bar и визуальная связь кнопок с сессией.

## Результат
`npm run test` — 784 passed, 1 skipped; `npm run lint`, `npm run typecheck` — OK
