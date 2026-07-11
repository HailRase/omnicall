# Rollback video logic to 81aeb84

**Дата:** 2026-07-12 02:13
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/media/browser/*`, `src/adapters/telephony/jssip/*`
- `AccountBootstrapFacade.ts`, `CallEngine.ts`, `TelephonyGateway.ts`
- `CallVideoSurface*`, `VideoFullscreen*`, `CallContextShell*`, `SoftphoneReadyShell.tsx`
- `useVideoCallActions.ts`, `useCallFeatureShell.ts`, `Dialpad.module.css`
- `docs/softphone/Feature-Registry.md` (F-027)

## Что
- Working-tree видео-логика после `81aeb84` сброшена к commit checkpoint
- Удалены `executeJsSipRenegotiate.ts` / `.test.ts` (появились после checkpoint)
- Сохранены: fullscreen incoming overlay + `ensureOutboundVideoSenderSynced`
- Не трогались не-видео изменения вне этих путей

## Зачем
- Откат регрессий mute/share/privacy/renegotiate; вернуть стабильную точку запроса про fullscreen incoming + outbound video

## Результат
- `git diff 81aeb84` по video-путям — пусто
- vitest media/jssip/call UI/projections: 160 passed
