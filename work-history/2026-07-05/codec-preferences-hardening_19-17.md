# Codec preferences hardening (F-022)

**Дата:** 2026-07-05 19:17
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/telephony/jssip/prepareJsSipSessionCodecPreferences.ts`
- `src/adapters/telephony/jssip/logNegotiatedAudioCodecs.ts`
- `src/adapters/telephony/jssip/applyCodecPreferencesToPeerConnection.ts`
- `src/adapters/telephony/jssip/wireJsSipCodecPreferences.ts`
- `src/adapters/telephony/jssip/JsSipTelephonyAdapter.ts`
- `src/renderer/components/settings/panels/SettingsCodecsPanel.tsx`
- `docs/softphone/P11-Codec-Preferences-Design.md`, `Feature-Registry.md`

## Что
- Устранена гонка codec wiring: resolve стартует до `ua.call`, listeners вешаются синхронно после resolve; `answerCall` ждёт `prepare` идемпотентно.
- `setCodecPreferences` обёрнут в try/catch с structured warn; сохранены все варианты capabilities и auxiliary codecs.
- Добавлена диагностика negotiated audio codecs через WebRTC stats после confirmed/accepted.
- Видеокодеки в UI отключены (future-only); адаптер применяет только audio MIME.
- Расширены unit-тесты (race, re-INVITE SDP, throw, video skip, diagnostics).

## Зачем
Сделать F-022 production-ready: без регрессий звонков, с наблюдаемыми сбоями и детерминированным SDP fallback.

## Результат
- `npm run test` — 1112 passed
- `npm run lint`, `npm run typecheck`, `npm run i18n:check`, `npm run registry:check` — OK
