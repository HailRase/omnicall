# External Services UI polish follow-up

**Дата:** 2026-07-30 12:33
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/external-services/*`
- `src/renderer/hooks/useExternalServicesPanel.ts`
- `src/renderer/i18n/messages.ts`, `catalogs/bgMessages.ts`
- `external-services-plan/05-UI-UX.md`

## Что
- Welcome: только центрированный select-prompt
- Response/History: drag-resize по высоте + collapse
- Меню `⋯` в стиле quick-add; Enable/Disable действия; sync draft при toggle
- Индикатор enabled/disabled absolute у request; gap в create-диалоге; компактные KV; body none без textarea; меньше gap method↔name

## Зачем
- Дополировка UX External Services без потери функций

## Результат
- UI tests 14/14 pass; typecheck pass
