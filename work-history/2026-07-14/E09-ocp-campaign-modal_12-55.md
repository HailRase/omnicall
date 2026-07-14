# F-028 E-09 OCP campaign modal

**Дата:** 2026-07-14 12:55
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/integration/ocp/OcpCampaignEventModal.tsx`
- `src/renderer/hooks/useOcpCampaignModal.ts`
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `src/renderer/i18n/messages.ts`, `catalogs/bgMessages.ts`
- `docs/softphone/Feature-Registry.md`, `TASK-QUEUE.md`, `STATUS.md`
- `ocp-integration/OCP-IMPLEMENTATION-PLAN.md`

## Что
- Модалка кампании на UI Kit Dialog: Accept/Reject, без Escape и outside dismiss
- Хук `useOcpCampaignModal` читает `activeCampaign`, вызывает Accept/Reject Use Cases, очищает projection
- Wiring в overlay-слое `SoftphoneReadyShell`
- i18n `ocp.campaign.modal.*` для ru/en/fr/de/bg + тесты
- Toast sink уже был в T-021 — в E-09 не дублировался

## Зачем
- Показать оператору обязательный выбор по входящему OCP campaign invite и завершить UI-часть E-09.

## Результат
- `npm run test` — 1971 passed, 1 skipped
- `npm run lint`, `typecheck`, `i18n:check`, `ui:catalog` — green
