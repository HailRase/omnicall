# Fix JsSIP registration retry race (Connection Error vs 200 OK)

**Дата:** 2026-06-24 12:52
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/telephony/jssip/awaitJsSipRegistration.ts`
- `src/adapters/telephony/jssip/JsSipTelephonyAdapter.ts`
- `src/adapters/telephony/jssip/resolveJsSipTransportUrl.ts`
- `awaitJsSipRegistration.test.ts`, `JsSipTelephonyAdapter.test.ts`, `resolveJsSipTransportUrl.test.ts`

## Что
- `awaitJsSipRegistration`: игнор transient `Connection Error`, ждём `registered` или timeout 30s
- Немедленный fail только на non-transient ошибках (Authentication Error и т.д.)
- `resolveJsSipTransportUrl`: сохранение path `/ws`, порты 443/80 для явных wss/ws URL
- +7 unit-тестов; 532 passed

## Зачем
На dev SBC SIP 200 OK приходил на CSeq 5, но UI падал на раннем `registrationFailed(Connection Error)` до события `registered`.

## Результат
`npm run test` 532 passed; lint/typecheck green. Перезапустить `npm run dev` и Register — ожидается Registered без overlay.
