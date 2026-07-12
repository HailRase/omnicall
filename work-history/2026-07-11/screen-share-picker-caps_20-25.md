# Screen-share picker and capture caps (F-027)

**Дата:** 2026-07-11 20:25
**Статус:** выполнено
**Коммит:** —

## Где
- `src/main/media/` (display-media handler, IPC, pending store)
- `src/shared/ipc/DisplayCaptureContract.ts`, `PreloadApi`, preload
- `src/adapters/media/browser/` (constraints + encoding policy)
- `src/renderer/hooks/useScreenSharePicker.ts`, `useVideoCallActions.ts`
- `src/renderer/components/call/ScreenSharePickerDialog.tsx`
- `src/renderer/shells/call/CallControlsShell.tsx`
- `docs/softphone/Feature-Registry.md` (F-027)

## Что
- In-app picker экранов/окон через IPC `desktopCapturer` вместо авто-grant первого screen
- Main выдаёт getDisplayMedia только выбранному pending source (`useSystemPicker: false`)
- Cancel picker не трогает video projection / Use Case
- Caps: 1920×1080, 15–30 fps; `contentHint=detail` + maxFramerate/maxBitrate на sender
- Тесты contract/handler/picker/hook/adapter; i18n parity ru/en/fr/de/bg

## Зачем
- Убрать NotSupportedError/лаги и дать выбор источника как в Telemost, без регрессии audio/video mute/hold/fullscreen

## Результат
- `npx vitest run` по связанным suites: 9 files / 28 tests passed
- `tsc --noEmit`: ok
- Регрессии stop-share→camera muted, audio-only answer gate, fullscreen layout не затронуты по дизайну (Domain без MediaStream)
