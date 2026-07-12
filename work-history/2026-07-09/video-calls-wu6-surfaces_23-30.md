# Video calls WU6 surfaces (F-027)

**Дата:** 2026-07-09 23:30
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/use-cases/media/*`, `AccountBootstrapFacade.ts`, `CallEngine.ts`
- `src/ports/media/MediaGateway.ts`, `BrowserMediaAdapter.ts`, `peerConnectionMedia.ts`
- `src/renderer/components/call/CallVideoSurface.tsx`, `CallControlsBar.tsx`
- `src/renderer/stores/useAccountBootstrapStore.ts`, `useVideoCallActions.ts`, shells

## Что
- Доведены Use Cases mute/source/view и facade API + `bindCallVideoSurfacesById`
- UI projection `callVideoMediaUiProjection` в Zustand; binding remote/local `<video>` через Media adapter
- Контролы камеры / screen share / expand на `CallControlsBar`; surface в `CallContextShell`
- Camera availability из JsSIP capture; i18n ru/en/fr/de/bg; тесты surface/controls

## Зачем
- Закрыть WU6: видео-поверхности и управление медиа без MediaStream в Domain/Zustand

## Результат
- `tsc` green; `npm run lint` green; targeted vitest (CallVideoSurface, CallControlsBar, i18n) passed
- Следующее: WU7 incoming Answer with video
