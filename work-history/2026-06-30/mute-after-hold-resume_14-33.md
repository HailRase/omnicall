# Mute survives hold/unhold renegotiation (F-004 + F-005)

**Дата:** 2026-06-30 14:33
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/services/telephonyCallControlOperations.ts` — `executeResumeCall`
- `src/adapters/media/browser/BrowserMediaAdapter.ts` — `enforceMutedLocalTracksIfNeeded`
- `src/application/services/mediaCallControlOperations.ts` — `reapplyMutedMediaStateIfNeeded` (без изменений логики)
- `docs/softphone/Feature-Registry.md` — F-004, F-005
- `docs/softphone/Legacy-Feature-Coverage.md` — LF-022, LF-024

## Что
- В `executeResumeCall` после `attachRemoteAudioWhenReady` вызывается `reapplyMutedMediaStateIfNeeded` — закрыт сценарий A (локальный resume)
- `BrowserMediaAdapter.attachRemoteAudio` принудительно отключает local audio track, если `callId ∈ mutedCalls` — safety net после re-INVITE
- Лог `browser_media_mute_enforced_after_attach` с featureId F-005
- Тесты: local hold+resume muted/unmuted (`CallEngine.test.ts`), enforce on attach (`BrowserMediaAdapter.test.ts`); remote path — `CallEngine.remoteHold.test.ts`

## Зачем
- JsSIP hold/unhold делает re-INVITE → WebRTC renegotiation сбрасывает `track.enabled = true`, хотя domain `Call.muted === true` и UI показывает «микрофон выкл».

## Результат
- Решение: **вариант C** (adapter enforcement + application reconcile в resume paths)
- `npm run test` — 916 passed, 1 skipped
- `npm run lint` — ok
- `npm run typecheck` — ok
- Manual smoke на real JsSIP/SBC — требует проверки оператором (сценарии A/B)
