# OCP ACD SDK event + queue badge

**Дата:** 2026-07-26 19:15
**Статус:** выполнено
**Коммит:** —

## Где
- `axatalk-sdk/packages/protocol` — `call:acd-context`
- `src/domain/integration/ocp/events/CallOcpContextResolved.ts`
- `src/application/services/integration/OcpTelephonyBridgeService.ts`
- `src/application/integration/ExternalSdkEventMapper.ts`
- `src/renderer/components/call/CallContextBadges.*`
- docs: OCP-Call-Context, PROTOCOL, events guide, ADR-0017, Registry, CHANGELOG

## Что
- Семантическое SDK-событие `call:acd-context` (queueLabel/phase/direction/masked remote/localPartyLabel; без acallid)
- Сохранён additive `queueLabel` на `call:*` (без даунгрейда)
- Queue badge: transparent + gray border + ellipsis + Tooltip

## Зачем
- CRM получает смысл MainCallIDInfo без OCP wire; UI читаемый при длинных названиях очереди

## Результат
- Desktop focused vitest PASS; protocol vitest PASS; api:check PASS
