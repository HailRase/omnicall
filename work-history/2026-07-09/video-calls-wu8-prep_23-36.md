# Video calls WU8 prep (F-027)

**Дата:** 2026-07-09 23:36
**Статус:** выполнено (prep; SBC smoke — ожидает стенд)
**Коммит:** —

## Где
- `docs/softphone/handoffs/P13-Video-Calls-WU8-SBC-Smoke-Checklist.md`
- `resolveInitialSessionView.ts`, `applyInitialSessionViewForCall.ts`
- `wireJsSipRtcSessionLifecycle.ts` (SIP INFO `no-video-remote`)
- `AccountBootstrapFacade` screen-share `onended` → camera restore

## Что
- Smoke-чеклист V1–V12 для ручного SBC gate
- Default/auto session view из UserSettings v5 на make/answer
- Приём INFO `no-video-remote` → `remoteVideoPresent=false`
- Wiring `onScreenShareEnded` в facade

## Зачем
- Закрыть кодовые пробелы перед WU8; F-027 → implemented только после PASS на SBC

## Результат
- `tsc` green; media/CallEngine tests passed
- F-027 остаётся in progress до ручного smoke
