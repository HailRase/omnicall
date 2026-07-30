# F-031 delay queue UX fixes

**Дата:** 2026-07-30 15:50
**Статус:** выполнено
**Коммит:** `e2dbf9a`

## Где
- `src/application/services/integration/external-services/ExternalServicesDelayScheduler.ts`
- `src/renderer/components/settings/external-services/ExternalServicesQueue.tsx`
- `src/renderer/components/settings/external-services/ExternalServicesTriggerList.tsx`
- `src/renderer/hooks/useExternalServicesPanel.ts`

## Что
- Исправлена проверка `validateJobStart` при fire (использование `.ok`).
- History обновляется после уменьшения waiting count.
- Triggers: компактный layout (label + switch + delay слева, без растягивания).
- Queue: method badge, имена, событие, время триггера, countdown `MM:SS`, delete icon, layout-анимации.

## Зачем
- Закрыть баги отображения delay/Queue и отсутствие записи в History.

## Результат
- `npm run typecheck` PASS; `npm run i18n:check` PASS.
