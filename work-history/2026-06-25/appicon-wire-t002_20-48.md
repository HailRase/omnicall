# T-002 Wire AppIcon (F-016)

**Дата:** 2026-06-25 20:48
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/shells/SoftphoneShellHeader.tsx`
- `src/renderer/components/call/CallLineRow.tsx`, `IncomingCallActions.tsx`, `ActiveCallControlsPanel.tsx`
- `src/renderer/components/shell/ShellOverlaySheet.tsx`, `call/CampaignEventModal.tsx`
- `src/renderer/components/call/IncomingCallModal.tsx`, `OutgoingCallCard.tsx`, `TransferPanel.tsx`
- `src/renderer/components/recovery/ConnectionOverlay.tsx`
- `src/renderer/components/icons/iconCatalog.ts`, `docs/softphone/Icon-Registry.md`

## Что
- Подключён `AppIcon` во всех 18 semantic id из `Icon-Registry.md`
- Shell header: icon-only controls (settings, diagnostics, collapse/expand, re-register, end session)
- Call controls: icon row + primary CTA в `CallLineRow`; `IncomingCallActions`; `ActiveCallControlsPanel`
- Индикаторы в заголовках: incoming/outgoing/transfer/connection-lost
- Close: `ShellOverlaySheet`, `CampaignEventModal` → `overlay.close`
- Registry + catalog: статус `active`; TASK-QUEUE T-002 → `done`

## Зачем
Завершить T-002 — семантические Lucide-иконки вместо текста/emoji; prerequisite для deferred tooltips (T-001).

## Результат
- `npm run test` — 694 passed, 1 skipped
- `npm run lint` — green
- `npm run typecheck` — green
- `npm run ui:catalog` — OK
