# Global incoming call overlay

**Дата:** 2026-07-08 20:18
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/call/IncomingCallOverlay.tsx`
- `src/renderer/hooks/useIncomingCallOverlayShell.ts`
- `src/renderer/hooks/useIncomingCallOverlayActions.ts`
- `src/renderer/shells/call/IncomingCallOverlayShell.tsx`
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `src/renderer/i18n/messages.ts`, `src/renderer/i18n/catalogs/bgMessages.ts`
- `docs/softphone/Feature-Registry.md` (F-002)

## Что
- Глобальный iPhone-like `IncomingCallOverlay` в shell overlay layer (top-center, non-modal)
- Dismiss по callId, body click → главная call surface без answer
- Answer/reject через существующие `useIncomingCallActions`; после успешного answer — навигация на `/`
- Закрытие конфликтующих UI modes: settings, DTMF, transfer target selection, number entry
- i18n ключи `incoming.dismissAria`, `incoming.openCallSurfaceAria` для ru/en/fr/de/bg
- 17 unit-тестов (overlay, shell hook, actions hook)

## Зачем
Входящий вызов должен быть виден поверх любого экрана и UI-состояния звонка, с навигацией на главную call surface при accept/click.

## Результат
- `npm run test` (3 файла): 17 passed
- `npm run i18n:check`: passed
- `eslint` на touched files: passed
