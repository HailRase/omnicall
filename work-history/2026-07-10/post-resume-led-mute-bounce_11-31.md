# Post-resume LED + mute bounce

**Дата:** 2026-07-10 11:31
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/headset/HeadsetSessionOrchestrator.ts`
- `src/application/headset/resolvePostResumeLedCommands.ts`
- `src/application/headset/forwardHeadsetHardwareEvent.ts`
- `src/application/headset/HeadsetSyncQueue.ts`
- `src/application/facades/AccountBootstrapFacade.ts`

## Что
- После resume: `answer` + confirmatory LED по свежему snapshot (solid / clear / selected)
- Mute-guard снова глушит все mute-edge 600ms (анти-bounce выкл→вкл в UI)
- Hold/resume с гарнитуры без повторного `beginUiHoldSync`

## Зачем
- LED не должен моргать после resume; при сбросе абонентом — погасить или взять selectedCall
- Убрать мигание mute в session controls bar

## Результат
- vitest headset suites: 40 passed
