# RAT Step 08 Multi-Call Real

**Дата:** 2026-06-25 12:08
**Статус:** не выполнено (R7 manual gate open)
**Коммит:** —

## Где
- `src/adapters/telephony/jssip/JsSipTelephonyAdapter.ts` (+ unit tests)
- `src/adapters/media/browser/BrowserMediaAdapter.ts`
- `src/application/services/telephonyCallControlOperations.ts`
- `docs/softphone/real-integration/PROGRESS.md`
- `docs/softphone/real-integration/SMOKE-CHECKLIST.md`

## Что
- Аудит JsSIP multi-session: per-call Map, независимый hold/resume/hangup (+3 unit-теста R7-1/2/4)
- BrowserMediaAdapter: exclusive remote audio (C1) — pause других линий при attach
- executeResumeCall: attachRemoteAudioWhenReady после unhold (R7-3)
- PROGRESS/SMOKE/Feature Registry/Legacy Coverage обновлены

## Зачем
Подготовить real JsSIP multi-call path (LF-021, LF-023, LF-032) после закрытия WU6 mock gate.

## Результат
- `npm run test`: 640 passed, 1 skipped
- `npm run lint`, `npm run typecheck`: OK
- R7 manual smoke на dev SBC **не выполнен** — gate step 08 открыт до R7-1…R7-3 PASS
