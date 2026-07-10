# Исходящий вызов → selectedCall

**Дата:** 2026-07-10 14:16
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/telephony/resolveOutgoingInProgressCallId.ts`
- `src/renderer/hooks/useCallFeatureShell.ts`
- `docs/softphone/Feature-Registry.md` (F-003)

## Что
- Добавлен `resolveOutgoingInProgressCallId` (Connecting / outbound Ringing)
- При новом исходящем UI и `userSelectedCallId` переключаются на него
- После connect остаётся на этой сессии; при fail — откат к предыдущему selected
- Входящий ringing по-прежнему приоритетнее для UI selection

## Зачем
- Исходящий должен становиться selectedCall (controls bar / session chrome), а не только headset focus

## Результат
- `npx vitest run src/application/projections/telephony/resolveOutgoingInProgressCallId.test.ts` — 4 passed
