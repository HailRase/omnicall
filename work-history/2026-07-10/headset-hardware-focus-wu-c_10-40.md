# Headset hardware focus targets (WU-C)

**Дата:** 2026-07-10 10:40
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/headset/forwardHeadsetHardwareEvent.ts`
- `src/application/headset/resolveHangupTargetId.ts`
- `src/application/headset/HeadsetSessionOrchestrator.ts`
- `src/application/headset/forwardHeadsetHardwareEvent.test.ts`

## Что
- Hook-off resume → focused Held (в т.ч. при исходящем наборе)
- Hook-on hangup → focused session (Held не роняет Active)
- Mute → toggle на focus (Active или Held)
- Domain events / sync-guard clear завязаны на focus

## Зачем
- Кнопки гарнитуры управляют выбранной сессией, а не только «первым Active»

## Результат
- `npx vitest run src/application/headset` — 27 passed
