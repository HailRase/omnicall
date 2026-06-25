# P11 WU2 Call Line UX

**Дата:** 2026-06-25 15:02
**Статус:** выполнено
**Коммит:** `e333123`

## Где
- `src/renderer/components/call/CallLineRow.tsx`
- `src/application/projections/deriveCallLineStatusLabel.ts`
- `src/application/projections/deriveCallLinesShell.ts`
- `src/renderer/shells/call/CallContextShell.tsx`
- `docs/softphone/P11-Call-Line-UX-Design.md`
- `docs/softphone/handoffs/P11-WU2-Call-Line-UX-Handoff.md`

## Что
- Unified `CallLineRow` в ContextZone для 1 и N линий (hold/mute/transfer/hangup/resume)
- `deriveCallLineStatusLabel` + расширенный view-model (`displayName`, timer, queue, primary action)
- `ActiveCallControlsPanel` убран из ControlsZone; dialpad + TransferPanel остаются
- Blocking `ConnectionOverlay` scrim — fix click-through на dialpad
- Тесты (+12), Storybook, ui:catalog, Feature Registry / blueprint

## Зачем
Приблизить operator UX к legacy `jssip-phone` (~260px): управление на карточке линии, не под dialpad.

## Результат
`npm run test` — 663 passed, 1 skipped; `npm run lint` + `npm run typecheck` — OK; gate WU2 готов к review.
