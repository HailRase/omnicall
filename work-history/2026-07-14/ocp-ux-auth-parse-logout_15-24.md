# OCP UX auth parse logout panel

**Дата:** 2026-07-14 15:24
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/integration/ocp/parseOcpMessage.ts`
- `src/adapters/integration/ocp/OcpWebSocketAdapter.ts`
- `src/renderer/components/integration/ocp/OcpLogoutReasonModal.tsx`
- `src/renderer/hooks/useOcpLogoutModal.ts`
- `src/renderer/widgets/OperatorStatusSelector/OperatorStatusSelector.module.css`

## Что
- Устойчивый parse `users` / `operator_status_reasons` (string ids, object|array, fallback label/status_time)
- Warn-лог при parse_error (раньше silent) — видно почему нет auth
- Logout UI: `ShellDialpadPanel` sidebar как contacts/history (не fullPanel modal scrim)
- Logout confirm шлёт `change_status_to_logout` при наличии operator profile + reason
- Status selector `flex-shrink: 0` в header

## Зачем
Починить отсутствие статуса в header, reject-with-break, «модального» logout и отсутствия WS logout — общий корень: без успешного `users` нет `isAuthenticated`.

## Результат
- Фокусные тесты parse/logout/reject/status — green
- lint/typecheck — green
- Перезапустить `npm run dev` и переподключить OCP; в консоли не должно быть `OcpWS message parse failed` для `users`
