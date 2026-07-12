# Headset focus contract (WU-A)

**Дата:** 2026-07-10 10:35
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/headset/session/resolveHeadsetSessionFocus.ts`
- `src/application/headset/buildHeadsetCallSnapshot.ts`
- `src/application/services/headset/HeadsetIntegrationService.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/renderer/hooks/useCallFeatureShell.ts`
- `docs/softphone/Feature-Registry.md`, `docs/softphone/handoffs/P10-Headset-Integration-Handoff.md`

## Что
- Добавлен resolver фокуса: incoming → operator selection → primary → active/outgoing/held
- Snapshot расширен полями `focusSessionId` / `focusedIsMuted` / `focusedIsOnHold` / `focusReason`
- UI selection прокидывается в Application через `setHeadsetSelectedCallId` (без затирания при auto-incoming)
- После ухода incoming UI восстанавливает предыдущий `userSelectedCallId`
- LED/hardware пока без изменений (WU-B/C)

## Зачем
- Заложить контракт привязки гарнитуры к выбранной сессии для мультисессионного паритета без поломки текущего LED path

## Результат
- `npx vitest run src/application/headset` — 11 passed
- `npx tsc --noEmit` — green
