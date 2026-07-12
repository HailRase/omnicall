# Fix mute regression after video renegotiate

**Дата:** 2026-07-12 01:55
**Статус:** не выполнено
**Коммит:** — (откат: `rollback-video-to-81aeb84_02-13.md`)

## Где
- `AccountBootstrapFacade.ts`, `CallEngine.ts`, `JsSipTelephonyAdapter.ts`, `TelephonyGateway.ts`
- `VideoFullscreenControlsBar.tsx`, `VideoFullscreenModal.module.css`, `Dialpad.module.css`

## Что
- Renegotiate только при включении камеры/screen; выключение = replaceTrack(null) + sync JsSIP mute flags
- После renegotiate: JsSIP audio/video mute flags + `reapplyMutedMediaStateIfNeeded` (нет unmute mic)
- Stop screen-share в fullscreen всегда enabled при active share; dialpad video = green call style; close blur+hover light/dark

## Зачем
- Откатить downgrade: mic mute и video-off должны сохраняться
- Починить stop трансляции в fullscreen и UI polish

## Результат
- Vitest related suites — OK; ESLint — OK
