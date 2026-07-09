# Video call bugfixes

**Дата:** 2026-07-10 00:12
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/services/telephony/IncomingCallOrchestrator.ts`
- `src/adapters/media/browser/replaceOutboundVideoTrack.ts`
- `src/domain/media/SessionViewMode.ts`
- `src/renderer/components/call/CallControlsBar.tsx` (+ CSS)
- `src/renderer/hooks/useVideoCallActions.ts`

## Что
- Incoming answer: `selectMediaMode` до gateway answer (камера/remote presence больше не теряются)
- Screen share: `replaceTrack` только на video sender (не audio → NotSupportedError)
- Expand: цикл compact→expanded→fullscreen→compact; кнопка не disabled в fullscreen
- Controls: flex-wrap, фиксированная ширина кнопок — без горизонтального overflow

## Зачем
- Исправить 4 бага smoke-теста видеозвонков на Windows

## Результат
- targeted vitest 48 passed; typecheck green
- Installer: `dist/win-fix/Axatalk-0.8.0-win-x64.exe`
- Не закоммичено (ожидает запрос пользователя)
