# Video mute / stop share / fullscreen close

**Дата:** 2026-07-12 02:07
**Статус:** не выполнено
**Коммит:** — (откат: `rollback-video-to-81aeb84_02-13.md`)

## Где
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/renderer/hooks/useVideoCallActions.ts`
- `src/adapters/media/browser/replaceOutboundVideoTrack.ts`
- `src/renderer/components/call/VideoFullscreenModal.module.css`
- `docs/softphone/Feature-Registry.md`

## Что
- Всегда `renegotiateCallMedia` после mute камеры и смены источника (в т.ч. stop share)
- JsSIP mute flags + `reapplyMutedMediaStateIfNeeded` — микрофон не поднимается
- Toggle читает свежий `getCallVideoMediaState` перед действием
- Close в fullscreen: фон ~8% dark / ~16% light
- F-027 evidence обновлён под always-renegotiate

## Зачем
- Выключение камеры и остановка трансляции должны доходить до remote во всех view mode; close — визуально легче

## Результат
- vitest: BrowserLocalMediaCaptureAdapter, replaceOutboundVideoTrack, JsSipTelephonyAdapter — 66 passed
- eslint на затронутых TS — ok
