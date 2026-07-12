# Fullscreen controls and screen-share picker

**Дата:** 2026-07-11 23:48
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/call/VideoFullscreenControlsBar.module.css`
- `src/renderer/components/icons/iconCatalog.ts` / `docs/softphone/Icon-Registry.md`
- `src/main/shellWindow/ShellWindowController.ts`
- `src/main/media/registerDisplayCaptureIpc.ts` / `nativeImageToPreviewDataUrl.ts`
- `src/shared/ipc/DisplayCaptureContract.ts`
- `src/renderer/components/call/ScreenSharePickerDialog.tsx`
- `src/renderer/shells/SoftphoneReadyShell.tsx`

## Что
- Mic/cam off: красный фон + белая иконка; обычные иконки — primary; hangup — `Phone` без перечёркивания
- Восстановление compact main-display: snapshot guard + sanitize work-area размера; hangup вызывает `exitVideoFullscreen`
- Picker: отдельные `getSources` для screen/window, thumbnail 640×360, fallback `appIconDataUrl`, валидация пустых preview

## Зачем
- Довести UX fullscreen-бара и screen-share picker (F-027) без регрессии layout/shell

## Результат
- vitest: VideoFullscreenControlsBar, ScreenSharePicker, DisplayCaptureContract, ShellWindowController, nativeImageToPreviewDataUrl — 23 passed
- eslint + stylelint на затронутых файлах: ok
