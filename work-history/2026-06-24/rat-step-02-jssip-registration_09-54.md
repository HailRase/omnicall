# RAT Step 02 — JsSIP Registration

**Дата:** 2026-06-24 09:54
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/telephony/jssip/` — JsSipTelephonyAdapter, createJsSipUserAgent, JsSipUaPort
- `src/infrastructure/bootstrap/createRealAccountBootstrap.ts`
- `src/renderer/bootstrap/readSipEnvDefaults.ts`
- `src/renderer/components/account/AccountPanel.tsx`
- `package.json` — dependency `jssip`
- `docs/softphone/real-integration/PROGRESS.md`

## Что
- Реализован `JsSipTelephonyAdapter` (register, unregister, reconnectTransport, setTransportDisconnectedHandler)
- Остальные методы `TelephonyGateway` — stub с `not_implemented`
- `createRealAccountBootstrap` подключает реальный SIP-адаптер вместо stub-ошибки
- Чтение `VITE_SIP_*` из `.env.local` для prefill AccountPanel
- 6 unit-тестов адаптера + optional integration (`SIP_SANDBOX=1`)
- Добавлен `not_implemented` в `PlatformErrorCode`

## Зачем
RAT R1: реальная SIP-регистрация на dev SBC через JsSIP за портом TelephonyGateway без изменений Domain/Use Cases.

## Результат
- `npm run test` — 502 passed (+6), 1 skipped (SIP_SANDBOX)
- `npm run lint` — ok
- `npm run typecheck` — ok
- Manual smoke R1 на dev SBC — ожидает проверки с `.env.local`
