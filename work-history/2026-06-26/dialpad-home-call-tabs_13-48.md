# Dialpad home screen with call session tabs

**Дата:** 2026-06-26 13:48
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/call/CallSessionTab.tsx`
- `src/renderer/components/call/CallSessionTabs.tsx`
- `src/renderer/components/call/ActiveCallQuickBar.tsx`
- `src/renderer/components/dialpad/Dialpad.tsx`
- `src/renderer/shells/call/CallControlsShell.tsx`
- `src/renderer/shells/call/CallContextShell.tsx`
- `src/renderer/widgets/SoftphoneLayout/`

## Что
- Dialpad как главный экран: controls zone первым в layout
- Split input + call button; крестик внутри input удаляет последнюю цифру
- Компактные табы сессий над dialpad: номер, таймер, badge «Удерж.», mute icon
- Клик по held-табу — resume; compact `ActiveCallQuickBar` для hold/mute/transfer/hangup
- Полные `CallLineRow` только в collapsed mode; outgoing card в context сохранён

## Зачем
Минималистичный home-screen UX: dialpad сразу при открытии, переключение звонков табами без громоздких строк.

## Результат
- `npm run test` — 743 passed, 1 skipped
- `npm run lint`, `npm run typecheck`, `npm run ui:catalog` — green
- Feature Registry F-016, STATUS.md обновлены
