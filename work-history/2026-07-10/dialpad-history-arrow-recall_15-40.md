# Dialpad history arrow recall

**Дата:** 2026-07-10 15:40
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/helpers/dialpadHistoryRecall.ts`
- `src/renderer/hooks/useDialpadShell.ts`, `useCallFeatureShell.ts`
- `src/renderer/components/dialpad/Dialpad.tsx`
- `src/renderer/shells/call/CallControlsShell.tsx`
- `docs/softphone/Feature-Registry.md` (F-003, F-013)

## Что
- ArrowDown/ArrowUp по уникальным номерам истории (newest first) в dialpad input
- При пустом поле + SIP registered + есть история кнопка Call активна
- Первое нажатие Call подставляет последний номер, второе — исходящий вызов
- Работает в idle dialpad и number-entry overlay (один `CallControlsShell`)

## Зачем
- Классический UX набора: листание истории стрелками и redial через Call без открытия журнала.

## Результат
- `vitest` dialpadHistoryRecall + Dialpad — 25 passed
- SemVer не поднимали
