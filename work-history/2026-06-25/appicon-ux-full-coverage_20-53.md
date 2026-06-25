# AppIcon full UX coverage (F-016)

**Дата:** 2026-06-25 20:53
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/icons/iconCatalog.ts` (+9 semantic ids)
- `docs/softphone/Icon-Registry.md`
- Dialpad, StatusSelector, BreakReasonPicker, Logout modals, ConnectionOverlay
- TransferPanel actions, CampaignEventModal, OcpToastStack, SettingsOverlay
- MultiCallHoldAllIndicator, CallLineRow/ActiveCallControlsPanel retry

## Что
- Расширен registry: dial.*, operator.*, action.*, transfer.consultation, connection.retry
- Icon-only controls во всех оставшихся UX-зонах с критическими действиями
- Декоративные иконки в заголовках/индикаторах (settings legend, hold-all)
- Исправлен invalid HTML: `MultiCallHoldAllIndicator` — `div` вместо `p` (animated icon = div)

## Зачем
Полное покрытие `AppIcon` по UX/UI после T-002; единый icon-only паттерн до deferred tooltips (T-001).

## Результат
- `npm run test` — 694 passed, 1 skipped
- `npm run lint` / `typecheck` / `ui:catalog` — green

## Не в scope
- Bootstrap `AccountPanel` / `AuthStateView` (текстовые формы/статусы)
- Dialpad mode toggle Number/DTMF (сегментированный текстовый переключатель)
- Hover tooltips (T-001)
