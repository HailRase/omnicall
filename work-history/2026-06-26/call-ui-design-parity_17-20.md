# Call UI design parity (reference skeleton)

**Дата:** 2026-06-26 17:20
**Статус:** выполнено (задачи 1–6; задача 7 transfer polish — открыта)
**Коммит:** —

## Где
- `docs/softphone/handoffs/P11-Call-UI-Design-Parity-Handoff.md`
- `src/renderer/widgets/SoftphoneLayout/`
- `src/renderer/shells/call/CallContextShell.tsx`, `CallControlsShell.tsx`
- `src/renderer/components/call/CallSessionCard.tsx`, `CallSessionStack.tsx`, `CallIdleEmptyState.tsx`, `CallControlsBar.tsx`, `DtmfKeypadPanel.tsx`
- `src/renderer/components/dialpad/Dialpad.tsx`
- `src/renderer/components/call/OutgoingCallCard.tsx`
- `src/renderer/components/icons/iconCatalog.ts` (`dial.dtmf`)

## Что
- Перестроен layout: context сверху (сессии/idle/DTMF), controls снизу (управление + dialpad)
- Добавлены `CallSessionCard`, `CallSessionStack`, `CallIdleEmptyState` по референсу `softphone-electron-desigh`
- `CallControlsBar` с подписями (mute, hold/resume, transfer, DTMF, hangup) вместо icon-only quick bar
- Dialpad: full-width input, sublabels, зелёная CTA «Позвонить», сворачивание клавиш при активном звонке
- DTMF: отдельная `DtmfKeypadPanel` в context; toggle Номер/DTMF убран
- `OutgoingCallCard` без технических полей (UI state, call ID)

## Зачем
Привести скелет главного call-интерфейса к референсному дизайн-проекту без затрагивания settings/recovery overlay.

## Результат
- `npm run test`: 782 passed, 1 skipped
- `npm run lint`, `typecheck`, `ui:catalog`: green
- Открыто: Task 7 — визуальный polish `TransferPanel` под reference `TransferFlow`
