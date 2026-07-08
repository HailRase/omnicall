# P11 Codec Preferences — WU-4 Adapter Agent Prompt

> **Миссия:** применить `CodecPreferences` из настроек при `makeCall` / `answerCall` в JsSIP (F-022, LF-084). **STOP** после adapter gate — UI (`/ui` T-009) отдельно.

---

## ОБЯЗАТЕЛЬНО прочитать (порядок)

1. `docs/softphone/P11-Codec-Preferences-Design.md`
2. `docs/softphone/Feature-Registry.md` — **F-022**
3. `docs/softphone/STATUS.md` — baseline tests
4. `work-history/2026-07-05/codec-preferences-domain-wu2_18-10.md`
5. `work-history/2026-07-05/codec-preferences-port-wu3_*.md` (если есть)
6. `.cursor/skills/real-integration-agent/SKILL.md` — RAT scope для JsSIP
7. `docs/softphone/real-integration/JSSIP-FORK.md` — только `@hailrase/jssip`

---

## Контекст (что уже сделано)

| WU | Статус | Артефакты |
| --- | --- | --- |
| WU-2 Domain | **done** | `UserSettings` v3, `codecPreferences`, migration v2→v3, `validateCodecPreferences`, `reorderCodecPreferences` |
| WU-3 Port | **done** | `CodecPreferencesPort`, `SettingsRepositoryCodecPreferencesAdapter`, `resolveEnabledCodecs`, bootstrap inject в `JsSipTelephonyAdapter` |

### Ключевые пути

```txt
src/domain/media/CodecId.ts              — ids + MIME map
src/domain/media/CodecPreferences.ts     — defaults
src/ports/media/CodecPreferencesPort.ts
src/adapters/settings/SettingsRepositoryCodecPreferencesAdapter.ts
src/application/media/resolveEnabledCodecs.ts
src/adapters/telephony/jssip/JsSipTelephonyAdapter.ts — codecPreferencesPort injected, NOT used yet
src/infrastructure/bootstrap/createRealAccountBootstrap.ts
```

### Текущее поведение звонков (не сломать)

```typescript
// JsSipTelephonyAdapter.ts — DEFAULT_CALL_MEDIA_OPTIONS
mediaConstraints: { audio: true, video: false }
rtcOfferConstraints: { offerToReceiveAudio: true, offerToReceiveVideo: false }
```

---

## WU-4 Deliverables (`/adapter`)

| # | Модуль | Задача |
| --- | --- | --- |
| 1 | `buildJsSipCallMediaOptions.ts` | Собрать CallOptions/AnswerOptions (video остаётся false) |
| 2 | `applyCodecPreferencesToPeerConnection.ts` | `RTCRtpTransceiver.setCodecPreferences` на `peerconnection` |
| 3 | `mungeSdpCodecOrder.ts` | Pure SDP reorder/filter (unit tests с fixtures) |
| 4 | `wireJsSipCodecPreferences.ts` | Bind `sdp` (local) + hook после `peerconnection` |
| 5 | `JsSipTelephonyAdapter.ts` | На makeCall/answer: `await codecPreferencesPort.getCodecPreferences()` → apply |
| 6 | Tests | Adapter unit + обновить `JsSipTelephonyAdapter.test.ts`; manual SBC smoke checklist |
| 7 | Docs | Feature Registry F-022 evidence; work-history |

---

## Техническая стратегия (обязательно dual-layer)

1. **Primary:** на `session.on('peerconnection')` — `resolveEnabledCodecs(prefs, browserCaps)` → `setCodecPreferences` per transceiver. Не удалять RED/RTX/ULPFEC — только reorder media codecs (см. MDN / Mozilla blog).
2. **Fallback:** на `session.on('sdp', e)` когда `e.originator === 'local'` — `mungeSdpCodecOrder(e.sdp, resolvedMimeTypes)`; нужен для hold/resume re-INVITE.
3. **Defaults:** если port null или ошибка — fallback на `createDefaultCodecPreferences()` + текущий `DEFAULT_CALL_MEDIA_OPTIONS` (zero regression).

### JsSIP API

- `ua.call(target, options)` / `session.answer(options)` — CallOptions из jssip docs
- `session.on('sdp', …)` — modify `e.sdp` before send
- Import `@hailrase/jssip` **only** under `src/adapters/telephony/jssip/`

---

## Edge cases (checklist)

- [ ] Hold/resume re-INVITE сохраняет порядок
- [ ] Attended transfer consultation call — те же prefs
- [ ] DTMF после custom order — `telephone-event` в SDP
- [ ] Settings изменены mid-call — **не** renegotiate активный; только новые сессии
- [ ] MockTelephonyGateway — без изменений
- [ ] Multi-call — каждая новая сессия читает port заново

---

## Out of scope (STOP)

- React UI / SettingsCodecsPanel (`/ui` T-009)
- Video calls enablement (`video: true`)
- legacy operator platform, transfer R6
- SemVer bump / release (отдельно после UI+adapter gate)

---

## Verify

```bash
npm run test && npm run lint && npm run typecheck
```

Manual: исходящий INVITE SDP `m=audio` порядок = settings; входящий answer 200 OK — тот же порядок.

---

## После WU-4

1. **`/ui` T-009** — `SettingsCodecsPanel`: 2 колонки, checkboxes, `@dnd-kit` drag-drop, i18n ru/en
2. **`/preflight` → `/review`** gate F-022

---

## Baseline

- Tests: ~1073+ passed, 1 skipped (verify in STATUS.md)
- Feature: **F-022** in-progress
- Legacy: **LF-084**
