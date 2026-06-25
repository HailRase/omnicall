# P11 WU5 Slice I — Panels And Modals CSS Modules

**Дата:** 2026-06-25 19:53
**Статус:** выполнено
**Коммит:** (slice I, после e708560)

## Где
- `DialogPanel.module.css`, `TransferPanel`, `MultiLineCallList`, `StatusSelector`, `BreakReasonPicker`, `StatusTimer`
- `OcpToastStack`, `CampaignEventModal`, `LogoutReasonModal`, `LogoutActiveSessionConfirmationModal`
- `CallControlsShell.module.css`

## Что
- Все компоненты с global className без legacy CSS получили CSS Modules (panel-паттерн)
- Shared `DialogPanel` для modals
- `styles.css` без изменений (только focus-visible)
- Handoff Slice I, migration doc, Feature Registry

## Зачем
Завершение UI-4 migration для unstyled renderer components.

## Результат
- 694 passed, lint/typecheck/ui:catalog OK
- Следующий шаг: UI-4 final gate (focus-visible → globals, удалить styles.css)
