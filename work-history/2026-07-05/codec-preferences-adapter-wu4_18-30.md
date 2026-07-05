# Codec preferences adapter WU-4

**Дата:** 2026-07-05 18:30
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/telephony/jssip/buildJsSipCallMediaOptions.ts`
- `src/adapters/telephony/jssip/applyCodecPreferencesToPeerConnection.ts`
- `src/adapters/telephony/jssip/mungeSdpCodecOrder.ts`
- `src/adapters/telephony/jssip/wireJsSipCodecPreferences.ts`
- `src/adapters/telephony/jssip/resolveJsSipSessionCodecs.ts`
- `src/adapters/telephony/jssip/collectBrowserCodecCapabilities.ts`
- `src/adapters/telephony/jssip/JsSipTelephonyAdapter.ts`
- `docs/softphone/Feature-Registry.md` — F-022 WU-4 evidence
- `docs/softphone/TASK-QUEUE.md` — T-010 done

## Что
- Dual-layer apply: `setCodecPreferences` на peerconnection + SDP munging на `sdp` (local)
- `makeCall` / incoming `newRTCSession` / `answerCall` используют `buildJsSipCallMediaOptions` (audio-only)
- Загрузка prefs через `CodecPreferencesPort` с fallback на defaults (zero regression)
- Unit-тесты: munge SDP, peerconnection apply, wire, resolve, adapter integration
- Feature Registry F-022: adapter WU-4 done; UI pending

## Зачем
Новые RTC-сессии должны использовать порядок/enablement кодеков из UserSettings v3 (LF-084) без регрессии звонков.

## Результат
- `npm run test` — 1094 passed, 1 skipped
- `npm run lint` / `typecheck` — green
- Manual SBC smoke (human): исходящий INVITE `m=audio` порядок = settings; входящий answer 200 OK — тот же; hold/resume re-INVITE сохраняет порядок; DTMF `telephone-event` в SDP
- Следующий шаг: `/ui` T-009 SettingsCodecsPanel → `/preflight` → `/rat-review`
