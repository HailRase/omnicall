# F-028 E-10 UI dialpad block + reject-with-break

**Дата:** 2026-07-14 13:54
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/hooks/useDialpadShell.ts`
- `src/renderer/hooks/useOcpRejectWithBreak.ts`
- `src/renderer/hooks/useIncomingCallActions.ts`
- `src/renderer/components/call/IncomingCallRejectControl.tsx`
- `src/renderer/components/integration/ocp/OcpRejectBreakReasonModal.tsx`
- `src/renderer/shells/SoftphoneReadyShell.tsx`, `CallContextShell.tsx`, `IncomingCallOverlayShell.tsx`

## Что
- Dialpad/video call блокируются при `OperatorStatus.RESERVED_TO_CALL` с причиной `ocp.dialpad.reservedToCall`
- При OCP auth + break reasons Reject открывает меню: без перерыва / с указанием перерыва
- Выбор «с перерывом» → Dialog со списком причин → RejectCall + ReservePostCallStatus
- Без OCP — обычный SIP reject как раньше
- i18n ru/en/fr/de/bg + тесты hook/компонентов

## Зачем
Закрыть UI-часть F-028 E-10: резерв входящего OCP не даёт набирать, а отклонение может опционально увести оператора в перерыв.

## Результат
- `npm run test` — 1993 passed, 1 skipped
- `npm run lint`, `typecheck`, `ui:catalog`, `i18n:check` — green
- T-025 → done; E-10 fully closed; next E-12
