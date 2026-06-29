# Dialpad, DTMF per session, transfer number cleanup

**Дата:** 2026-06-29 13:34
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/callProjection.ts`
- `src/application/projections/multiLineCallProjection.ts`
- `src/renderer/hooks/useCallFeatureShell.ts`, `useSoftphoneCallActions.ts`, `useTransferActions.ts`
- `src/renderer/shells/call/CallContextShell.tsx`, `CallControlsShell.tsx`
- `src/renderer/components/call/DtmfKeypadPanel.tsx`
- `src/renderer/stores/useAccountBootstrapStore.ts`

## Что
- Очистка номера в dialpad после нажатия «Позвонить»
- Ответ на звонок больше не переключает режим на DTMF автоматически
- `dtmfPanelCallId` + история тонов (`dtmfHistory`) на уровне каждой линии в multi-line projection
- Очистка поля transfer target при старте/завершении перевода и консультации
- Тесты: `callProjection`, `multiLineCallProjection`, `DtmfKeypadPanel`

## Зачем
Согласовать UX набора номера, тонового режима и панели перевода с ожидаемым поведением оператора в multi-call.

## Результат
`npm run test` — 796 passed, 1 skipped; `npm run lint`, `npm run typecheck` — OK
