# Video calls WU4 capture adapter (F-027)

**Дата:** 2026-07-09 22:56
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/media/browser/BrowserLocalMediaCaptureAdapter.ts`
- `createStubVideoTrack.ts`, `replaceOutboundVideoTrack.ts`, `createLocalMediaStreamHandle.ts`
- `src/adapters/mock/MockLocalMediaCapturePort.ts`
- `docs/softphone/Feature-Registry.md` (F-027; ID исправлен — F-026 занят Caller Identity)

## Что
- Browser adapter: probe, capture (privacy-muted video), stub track, replaceTrack mute/source, screen `onended`
- Mock port для Application/UI тестов
- Feature ID video calls переименован в **F-027** (конфликт с F-026 Caller Identity)
- SIP/JsSIP video SDP по-прежнему выключен

## Зачем
- Подготовить Media capture слой до включения video в JsSIP (WU5)

## Результат
- Adapter unit tests: 6/6 PASS
- Settings suite ранее: 212 PASS (WU2)
- Следующий шаг: WU5 JsSIP video enablement (gated)
