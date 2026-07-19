# OCP sign-in cancel + error tooltips

**Дата:** 2026-07-19 19:35
**Статус:** выполнено
**Коммит:** `d3114b0`

## Где
- `AccountBootstrapFacade.cancelOcpSignInAttempt` + `OcpProjectionHub.applyServerState`
- `OcpProxyAuthenticateHttpAdapter` (HTTP detail)
- `OcpSignInProgress` layout / tooltips / stage copy
- `useAccountActions` reconnect = full restart

## Что
- Отключиться: cancel waiters → disconnect socket → `resetToIdle` (как logout cold-start)
- Игнор late `connecting` без active attempt
- Reconnect всегда с этапа 1 после idle reset
- HTTP 400 `Invalid PROXY_API_KEY` → реальное сообщение в tooltip `[detail]`
- Progress и иконки ✓/✗ на одной строке по вертикали
- Технические названия этапов

## Зачем
- Убрать «зависшее соединение» после cancel и дать саппорту/разработчику реальный текст ошибки.

## Результат
- Targeted tests green (adapter/projection/modal/useAccountActions)
