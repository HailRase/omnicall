# P13 Video Calls — WU9a/b/c + WU10 Stability Handoff (F-027)

- Scope: **F-027** video UX polish after WU6–WU7 + Settings Video UI — inbound answer gate, screen-share picker, fullscreen shell, stability fixes.
- Phase: P13 — **in progress** (WU8 SBC smoke next).
- Legacy: _none_ (new product feature; parity intent in `video-integration/video-integration.md`).

## Work units (this handoff)

| WU | Theme | Status |
| --- | --- | --- |
| WU9a | Inbound video-answer SDP gate; remote bind; work-area fullscreen; display-media handler | done |
| WU9b | Screen-share picker + capture caps (IPC, encoding policy) | done |
| WU9c | Session views `expanded\|hidden\|fullscreen`; fullscreen modal UX | done |
| WU10 | Video stability regressions (answer-with-video timing, fullscreen controls, shell restore) | done |

## Delivered

| Area | Path |
| --- | --- |
| Design | `docs/softphone/P13-Video-Calls-Design.md`, `adr/ADR-0008-video-calls-media-mode.md` |
| Domain | `SessionViewMode.ts`, `CallVideoMediaState.ts`, `videoMediaEvents.ts` |
| Application | `resolveFullscreenVideoSession.ts`, `incomingCallProjection.ts`, `CallEngine.ts` |
| Adapters | `JsSipTelephonyAdapter.ts`, `BrowserLocalMediaCaptureAdapter.ts`, `installDisplayMediaRequestHandler.ts`, `registerDisplayCaptureIpc.ts`, `applyScreenShareEncodingPolicy.ts` |
| IPC | `DisplayCaptureContract.ts`, `ShellWindowLayoutContract.ts` |
| Main | `ShellWindowController.ts`, `nativeImageToPreviewDataUrl.ts` |
| UI | `CallVideoSurface.tsx`, `CallControlsBar.tsx`, `VideoFullscreenModal.tsx`, `VideoFullscreenControlsBar.tsx`, `ScreenSharePickerDialog.tsx`, `IncomingCallSessionCard.tsx` |
| Shell | `SoftphoneReadyShell.tsx`, `CallContextShell.tsx`, `IncomingCallOverlayShell.tsx`, `SoftphoneLayout.tsx` |
| Hooks | `useIncomingCallActions.ts`, `useScreenSharePicker.ts`, `useCallFeatureShell.ts` |
| i18n | `call.video.screenShare.picker.*`, `call.controls.label.*` (ru/en/fr/de/bg) |

## WU9/WU10 Gate

- [x] «Answer with video» hidden only when `incomingRemoteVideoOffered === false`; early SDP preserved before `IncomingCallReceived`
- [x] `IncomingRemoteVideoOfferedChanged` + `notifyIncomingRemoteVideoOffered` ordering fix (WU10 regression)
- [x] Remote video bind / `remoteVideoPresent` stability via JsSIP SDP + projection
- [x] Screen share from **expanded or fullscreen** via in-app picker (`ScreenSharePickerDialog` + IPC pending source)
- [x] Cancel picker does not mutate video projection
- [x] Capture caps: ≤1920×1080 @15–30fps; `contentHint=detail` + sender bitrate/framerate policy
- [x] Session views `expanded | hidden | fullscreen`; work-area `video-fullscreen` shell expand/restore
- [x] `ensureOutboundVideoSenderSynced` after inbound video answer (`scheduleOutboundVideoSenderSync`)
- [x] Fullscreen modal: clickable controls (`pointer-events`), PiP inset ≥24px, mic icon polarity, off-state red buttons
- [x] Shell compact restore snapshot guard on hangup / leave fullscreen
- [x] No MediaStream in Zustand; UI → facade only
- [x] Feature Registry F-027 evidence (WU9a–c) updated
- [x] i18n parity ru/en/fr/de/bg; `i18n:check` PASS
- [x] Tests green (see Verification)

## Verification

```bash
npm run test && npm run lint && npm run typecheck && npm run i18n:check
```

Baseline pre-WU9 **1727** passed, 1 skipped → **1844** passed, 1 skipped (verified 2026-07-12).

Targeted suites: `incomingCallProjection.test.ts`, `JsSipTelephonyAdapter`, `BrowserLocalMediaCaptureAdapter.test.ts`, `resolveFullscreenVideoSession.test.ts`, `ScreenSharePickerDialog.test.tsx`, `VideoFullscreenModal.test.tsx`, `VideoFullscreenControlsBar.test.tsx`, `ShellWindowController.test.ts`, `DisplayCaptureContract.test.ts`.

## Work-history evidence

- `work-history/2026-07-11/F027-video-stability_19-36.md`
- `work-history/2026-07-11/F027-screen-share-fullscreen_20-05.md`
- `work-history/2026-07-11/screen-share-picker-caps_20-25.md`
- `work-history/2026-07-11/video-ux-refactor_22-44.md`
- `work-history/2026-07-11/fix-video-logic-fullscreen-ux_23-00.md`
- `work-history/2026-07-11/fullscreen-video-ux-polish_23-25.md`
- `work-history/2026-07-11/fullscreen-controls-screenshare-picker_23-48.md`

## STOP

Do not close F-027 (`implemented`) until **WU8** manual SBC smoke PASS — `handoffs/P13-Video-Calls-WU8-SBC-Smoke-Checklist.md`.

## Next

**P13 WU8** — manual SBC smoke + registry/STATUS close.
