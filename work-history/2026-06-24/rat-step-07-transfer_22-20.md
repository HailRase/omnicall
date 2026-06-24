# RAT Step 07 — Real SIP Transfer (R6)

**Дата:** 2026-06-24 22:20
**Статус:** выполнено (код + автотесты; R6 manual smoke pending)
**Коммит:** —

## Где
- `docs/softphone/adr/ADR-0003-sbc-refer-semantics.md`
- `src/adapters/telephony/jssip/executeJsSipRefer.ts`
- `src/adapters/telephony/jssip/JsSipTelephonyAdapter.ts`
- `src/adapters/telephony/jssip/JsSipTelephonyAdapter.test.ts`
- `docs/softphone/real-integration/SMOKE-CHECKLIST.md`
- `docs/softphone/real-integration/PROGRESS.md`
- `docs/softphone/Feature-Registry.md` (F-006, F-007)

## Что
- ADR-0003: REFER success = NOTIFY `accepted` (2xx sipfrag); failure = `requestFailed` / NOTIFY `failed`
- `blindTransfer` / `attendedTransfer` в `JsSipTelephonyAdapter` через JsSIP REFER (+ Replaces для attended)
- Расширен `JsSipRtcSessionPort.refer`; helper `executeJsSipRefer`, `buildAttendedReferTarget`
- Unit-тесты adapter event mapping (+8); mock regression без изменений
- SMOKE § R6 и PROGRESS step 07; Feature Registry real-track notes

## Зачем
Закрыть RAT step 07 — реальный SIP transfer на dev SBC без изменений Domain/Use Cases.

## Результат
- `npm run test` — 582 passed, 1 skipped
- `npm run lint` — green
- `npm run typecheck` — green
- Manual R6 (blind + attended на двух extension) — **pending**; gate открыт до smoke PASS
