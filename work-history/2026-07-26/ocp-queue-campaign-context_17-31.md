# OCP queue + campaign call context

**Дата:** 2026-07-26 17:31
**Статус:** выполнено
**Коммит:** —
**Версия:** `0.13.0`

## Где
- `src/application/projections/integration/callOcpContextProjection.ts`
- `src/application/projections/integration/deriveCallContextBadges.ts`
- `src/application/projections/integration/campaignEventProjection.ts`
- `src/application/services/integration/OcpTelephonyBridgeService.ts`
- `src/application/read-models/OcpProjectionHub.ts`
- `src/renderer/components/call/CallContextBadges.tsx`
- `src/renderer/components/integration/ocp/OcpCampaignEventModal.tsx`
- `docs/softphone/OCP-Call-Context.md`

## Что
- Проекция per-call очереди из `get_main_acallid` (пустая очередь = прямой/внутренний, без бейджа)
- Progressive campaign → только бейджи; preview → модалка accept/reject
- Бейджи на Incoming overlay / session card / CallSessionCard
- Компактная campaign-модалка по центру с blur scrim
- Документация, Registry, Legacy LF-037…040, i18n 5 локалей, SemVer `0.13.0`

## Зачем
- Закрыть gap vs jssip OCP module (очередь + CampaignEvent) без CustomEvent-костылей и без даунгрейда архитектуры Axatalk

## Результат
- Focused vitest PASS (projection/bridge/modal/badges/i18n/parse)
- `npm run i18n:check` PASS
- `npm run release:sync-manifest` PASS → `0.13.0`
