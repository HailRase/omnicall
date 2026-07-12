# F-027 Video UX refactor (WU9c)

**Дата:** 2026-07-11 22:44
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/media/browser/` — outbound sender sync / unmute replaceTrack
- `src/domain/media/SessionViewMode.ts`, `CallVideoMediaState.ts`
- `src/renderer/components/call/VideoFullscreenModal.tsx`, `VideoFullscreenControlsBar.tsx`, `CallVideoSurface.tsx`
- `src/renderer/shells/SoftphoneReadyShell.tsx`, `CallContextShell.tsx`
- `docs/softphone/Feature-Registry.md`, P13 schema/design

## Что
- Fix чёрного outbound после inbound answer: unmute + `ensureOutboundVideoSenderSynced` через replaceTrack
- Session views: `expanded | hidden | fullscreen` (legacy `compact` → `expanded`)
- Fullscreen: edge-to-edge модалка, oval controls, view-mode menu, всегда видимый PiP с inset 16px
- Incoming overlay сверху поверх fullscreen; unified session block; picker marquee + thumb min-height

## Зачем
- Убрать регрессии video UX и довести F-027 session/fullscreen/picker до продуктовых требований без downgrade audio/hold/mute

## Результат
- `npx vitest run` (связанные suites): 18 files / 106 tests passed
- `tsc --noEmit`: ok
