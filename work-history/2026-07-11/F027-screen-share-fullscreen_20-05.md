# F-027 screen share + fullscreen fit

**Дата:** 2026-07-11 20:05
**Статус:** выполнено
**Коммит:** —

## Где
- `src/main/media/installDisplayMediaRequestHandler.ts`
- `src/main/index.ts`
- `src/renderer/components/call/CallVideoSurface.module.css`
- `src/renderer/widgets/SoftphoneLayout/*`
- `src/renderer/shells/call/CallContextShell.*`

## Что
- Electron `setDisplayMediaRequestHandler` + `display-capture` permission — фикс `NotSupportedError` на getDisplayMedia.
- Fullscreen: context fill + `object-fit: contain` для remote video; скрыты лишние карточки в context.

## Зачем
- Рабочая трансляция экрана и корректный scaling видео на work-area.

## Результат
- vitest: display-media handler + SoftphoneLayout green; нужен рестарт приложения.
