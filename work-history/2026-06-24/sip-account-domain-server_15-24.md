# SIP account: domain + server вместо registrar

**Дата:** 2026-06-24 15:24
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/telephony/SipAccount.ts`
- `src/adapters/telephony/jssip/createJsSipUserAgent.ts`
- `src/adapters/telephony/jssip/buildOutgoingSipTarget.ts`
- `src/renderer/components/account/AccountPanel.tsx`
- `src/renderer/bootstrap/readSipEnvDefaults.ts`

## Что
- `SipAccountInput`: username, password, domain, server (убраны uri и registrar)
- URI вычисляется как `sip:{username}@{domain}` при создании аккаунта
- `server` → WebSocket transport через `resolveJsSipTransportUrl`
- `domain` → SIP AOR и исходящие вызовы
- AccountPanel: поля Username, Password, Domain, Server
- Env: `VITE_SIP_SERVER`, `VITE_SIP_DOMAIN` вместо REGISTRAR/URI
- Пример hostname: `onedemoserver.online` (не `ondemosever`)

## Зачем
Разделить SIP-домен (AOR) и сервер регистрации/WebSocket, как в legacy softphone.

## Результат
- `npm run typecheck` — ok
- `npm run test` — 544 passed, 1 skipped
- `npm run lint` — ok
