# Video downgrade, fullscreen и dialpad hover — bugfix

**Дата:** 2026-07-12 22:44
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/services/telephony/CallEngine.ts`, `CallEngine.test.ts`
- `src/renderer/hooks/useIncomingCallOverlayActions.ts`, `.test.ts`
- `src/renderer/components/dialpad/Dialpad.module.css`

## Что
- Отложенный downgrade video→audio: кандидат при remote audio-only до Active, применение на `handleOutboundCallAnswered` и peer connection
- Убран `exitVideoFullscreen` из post-answer навигации; fullscreen сохраняется после входящего видеоответа
- `exitVideoFullscreen` только при ручном переходе с overlay на dialpad
- Per-segment hover на dialpad call/video (inset background, не общий brightness)
- Тесты: deferred downgrade, overlay post-answer без сброса fullscreen

## Зачем
Исправить три регрессии: не срабатывал downgrade/уведомление при audio-only ответе, сброс fullscreen после входящего видео, отсутствие hover на сегментах dialpad.

## Результат
`CallEngine.test`, `useIncomingCallOverlayActions.test`, `typecheck` — passed
