# SDK campaign events в protocol v1 (ADR-0019)

**Дата:** 2026-07-26 18:13
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/adr/ADR-0019-sdk-campaign-events-v1.md` (+ правка ADR-0017 O-CAMP-1)
- `axatalk-sdk/packages/protocol` — events/snapshot/capabilities/fixtures/api
- `axatalk-sdk/packages/sdk` — `PUBLIC_EVENT_TYPES`
- `src/domain/integration/ocp/events/OperatorCampaignOffered.ts`, `OperatorCampaignCleared.ts`
- `src/application/integration/*`, `OcpSessionLifecycleService`, fan-out/snapshot strip
- `src/domain/settings/SdkOriginTrust.ts` — matrix + additive migration
- docs: `PROTOCOL.md`, `OCP-Call-Context.md`, guide events/capabilities, Feature Registry, STATUS

## Что
- Приняты публичные `operator:campaign-offered` / `cleared` и capability `operator.campaign.read`
- Redacted DTO + snapshot `operator.campaign`; fan-out/snapshot fail-closed без capability
- Domain Events + desktop mapper/lifecycle; Origin matrix i18n (ru/en/fr/de/bg)
- Accept/reject команды SDK не добавлялись (desktop modal остаётся control surface)

## Зачем
- Дать CRM/host паритет с F-028 campaign notify без OCP wire и без downgrade существующих API

## Результат
- `axatalk-sdk` `npm run preflight` — PASS
- Focused desktop vitest (mapper/snapshot/lifecycle/origin/modal) — PASS (76)
- `npm run i18n:check` — PASS
- Downgrade: только additive (новые optional поля/события/capability; миграция matrix default `true`)
