# F-028 E-08 OCP logout reason modal

**Дата:** 2026-07-14 12:37
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/hooks/useOcpLogoutModal.ts`
- `src/renderer/components/integration/ocp/OcpLogoutReasonModal.tsx`
- `src/renderer/shells/SoftphoneReadyShell.tsx`

## Что
- Gate читает **live** `OcpProjectionHub` в момент клика (не stale Zustand `isAuthenticated`)
- Модалка открывается при любом живом OCP: `connected` / `authenticated` / `connecting` / `reconnecting`
- Confirm: authenticated → `LogoutOperator` + SIP; только «Подключено» → `disconnectOcp` + SIP
- `requireReasonSelection=false` когда сессия ещё не authenticated и нет cached reasons

## Зачем
Починка: при статусе «Подключено» / активной OCP-сессии «Выйти» больше не уходит сразу в SIP-only.

## Результат
- 10 tests green; typecheck green
- Нужен полный рестарт Electron после правки
