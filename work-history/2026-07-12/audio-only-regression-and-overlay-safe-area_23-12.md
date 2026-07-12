# Audio-only regression and overlay safe area

**Дата:** 2026-07-12 23:12
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/services/telephony/CallEngine.ts`, `CallEngine.test.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/renderer/hooks/useVideoCallNotifications.ts`
- `src/renderer/components/notifications/NotificationViewport.tsx`
- `src/renderer/components/updates/UpdateAvailableBanner.module.css`
- `src/renderer/styles/tokens.css`

## Что
- Разделил источники remote video presence: downgrade outbound video→audio разрешён только для SIP/SDP сигнала, media-track сигнал больше не триггерит downgrade
- Добавлен тест: media-only сигнал отсутствия видео не должен переводить активный исходящий video-вызов в audio-only
- Уровень toast для `notification.video.remoteAudioOnly` изменён на `error`
- Для Sonner top-placement добавлены безопасные отступы от зон window controls (start/end)
- Update banner центрируется и ограничивается в безопасной inline-области, чтобы не заходить на controls
- В токены добавлены `--shell-window-controls-safe-inline-start/end`

## Зачем
Устранить ложный принудительный переход в audio-only при видео-ответе и убрать наложение banner/toasts на системные кнопки окна на Windows/macOS/Linux.

## Результат
`CallEngine.test`, `NotificationViewport.test`, `UpdateAvailableBanner.test`, `detectRemoteVideoPresence.test`, `peerConnectionMedia.test`, `typecheck` — passed
