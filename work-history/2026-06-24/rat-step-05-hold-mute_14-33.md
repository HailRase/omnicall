# RAT Step 05 — Hold & Mute Real (R4)

**Дата:** 2026-06-24 14:33
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/telephony/jssip/JsSipTelephonyAdapter.ts`
- `src/adapters/telephony/jssip/executeJsSipHoldResume.ts`
- `src/adapters/telephony/jssip/JsSipRtcSessionPort.ts`
- `src/adapters/telephony/jssip/wrapJsSipRtcSession.ts`
- `src/adapters/media/browser/BrowserMediaAdapter.ts` (без изменений — уже готов)
- `docs/softphone/real-integration/PROGRESS.md`
- `docs/softphone/Feature-Registry.md` (F-004, F-005)

## Что
- Реализованы `holdCall` / `resumeCall` через JsSIP re-INVITE (`executeJsSipHoldResume`)
- Расширен `JsSipRtcSessionPort` и `wrapJsSipRtcSession` методами hold/unhold
- Добавлены unit-тесты адаптера (+5) и helper-тесты (+3)
- Подтверждена UX-цепочка error banner + retry в `ActiveCallControlsPanel` (P04)
- Обновлены PROGRESS и Feature Registry real-track notes

## Зачем
Закрыть RAT Step 05 (LF-022 hold/unhold, LF-024 mute) на real SIP без scope creep в OCP/transfer.

## Результат
- `npm run test` — 541 passed, 1 skipped (+16 к baseline 525)
- `npm run lint` — green
- `npm run typecheck` — green
- Smoke R4 и carry-over R2+R3 — pending manual на dev SBC
